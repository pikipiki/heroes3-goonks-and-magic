/** Original wagon resource/empty/refill controls on a private native map. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign209-wagon';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]);

const source=JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/zc2-0.json'));
const originalBlock=source.blocks.find(b=>b.receiver==='OB'&&b.commands.some(c=>c.receiver==='WG'));assert(originalBlock);const originalBlockSha256=digest(JSON.stringify(originalBlock));
const fixture={originalMessages:['ZVSE private original wagon source control'],initializers:[command('HE',[n(0)],'W',[n(20000)]),message('WAGON READY')],blocks:[structuredClone(originalBlock),{kind:'trigger',receiver:'LE',selectors:[n(5),n(31),n(0)],conditions:[],commands:[command('VR',[v(499)],'S',[n(0)]),message('REFILL CONTROL READY')]}]};
fixture.sha256=digest(JSON.stringify(fixture));
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']);
let heroTemplate,eventTemplate,wagonTemplate;
for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;if(o.type==='event')eventTemplate??=o;}
assert(heroTemplate);header.name='Native source wagon proof';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private source binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:7,y:30,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1,experience:0,army:[{type:'wake-of-gods.creatures:gorynych',amount:1},{type:'core:pikeman',amount:1}]}};
for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc2.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString())))if(o.type==='wagon')wagonTemplate??=o;assert(wagonTemplate);
const wagon={...structuredClone(wagonTemplate),instanceName:'privateWagon',x:4,y:30,l:0};const event={...structuredClone(eventTemplate),instanceName:'privateRefill',x:5,y:31,l:0,options:{players:['red'],humanActivate:true,computerActivate:false,removeAfterVisit:false}};
const originalObjects=parseJsonc(readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps[1].map['objects.json'].toString()),opponent={...originalObjects.monster_501,instanceName:'privateGorynych',x:22,y:18};
const entries={'header.json':header,'objects.json':[...homes,hero,wagon,event],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const encode=entries=>execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});
const map=encode(entries),resetHeader={...header,name:'Native source attribute reset',events:[]},resetMap=encode({...entries,'header.json':resetHeader});fs.writeFileSync(out+'/private-source-attributes.vmap',map);

const browser=await (process.env.ATTRIBUTES_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],watchdog=setTimeout(()=>browser.close(),240000);page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(out+'/page-errors.log',e.stack+'\n')});page.on('requestfailed',r=>fs.appendFileSync(out+'/requests.log',r.url()+' '+r.failure()?.errorText+'\n'));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text()+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
let routedWasm=0;
if(process.env.CAMPAIGN_ENGINE_PATH)await page.context().route(/\/vcmiclient(?:\.[a-f0-9]+)?\.(js|wasm)(?:\?.*)?$/,route=>{const file=new URL(route.request().url()).pathname.endsWith('.wasm')?'vcmiclient.wasm':'vcmiclient.js';if(file.endsWith('wasm'))routedWasm++;return route.fulfill({path:path.join(process.env.CAMPAIGN_ENGINE_PATH,file),contentType:file.endsWith('wasm')?'application/wasm':'text/javascript',headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'}});});
await page.addInitScript(({map,resetMap,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');if(!entry||entry.enabled)throw Error('Expected dormant registry');const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,{initializers:fixture.initializers,blocks:fixture.blocks,originalMessages:fixture.originalMessages,sha256:fixture.sha256});entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Native-quest-rules.vmap',new Uint8Array(map));m.FS.writeFile(root+'Maps/000-Native-attributes-reset.vmap',new Uint8Array(resetMap));return invoke.apply(m,args);}});}});},{map:[...map],resetMap:[...resetMap],fixture});


const visits=[],seen=new Set();
async function ready(){for(let i=0;i<900;i++){const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));assert.deepEqual(errors,[]);const body=JSON.stringify(s.dialogPresentation||{});assert(!body.includes('Original script error:'),body);
 if(s.mode==='dialog'){const key=s.windowToken+':'+body;if(!seen.has(key)){seen.add(key);dialogs.push(s.dialogPresentation);fs.writeFileSync(out+'/dialogs.json',JSON.stringify(dialogs,null,2));if(s.dialogPresentation.lines?.join(' ').includes('WAGON READY')&&!process.env.ATTRIBUTES_LOAD_SAVE){const bytes=await readCompletedNativeSave(page,cmd);fs.writeFileSync(out+'/pending-wagon.vsgm1',bytes);}await cmd(1);}}
 else if(s.mode==='map'&&s.turn&&!s.campaignPending&&!s.heroMoving&&!s.hasPath){await page.waitForTimeout(350);return s;}await page.waitForTimeout(100);
}throw Error('Wagon fixture did not settle');}
async function centerTile(x,y){for(let i=0;i<30;i++){const mini=(await state()).mapOverview;await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,5),{x:Math.max(mini.rect.x+1,Math.min(mini.rect.x+mini.rect.w-1,Math.round(mini.rect.x+x*mini.rect.w/mini.width))),y:Math.max(mini.rect.y+1,Math.min(mini.rect.y+mini.rect.h-1,Math.round(mini.rect.y+y*mini.rect.h/mini.height)))});await page.waitForTimeout(120);const m=(await state()).mapOverview;if(m.viewport.x===Math.floor(x+0.5-Math.floor(m.view.w/2)/32)&&m.viewport.y===Math.floor(y+0.5-Math.floor(m.view.h/2)/32))return m.view;}throw Error('Camera did not center');}
async function move(x,y){const view=await centerTile(x,y);await page.evaluate(r=>Module._vcmiMobilePointer(Math.round(r.x+r.w/2),Math.round(r.y+r.h/2),1),view);await wait(()=>goonkMobileState.hasPath||goonkMobileState.mode==='dialog');await cmd(2);return ready();}
try{
 const engine=process.env.CAMPAIGN_ENGINE_PATH?{sha256:digest(fs.readFileSync(path.join(process.env.CAMPAIGN_ENGINE_PATH,'vcmiclient.wasm')))}:await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 if(process.env.ATTRIBUTES_LOAD_SAVE){const bytes=fs.readFileSync(process.env.ATTRIBUTES_LOAD_SAVE);assert.equal(digest(bytes),process.env.ATTRIBUTES_EXPECTED_SAVE_SHA);await page.evaluate(bytes=>{const root='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(root);Module.FS.writeFile(root+'Goonk-auto.vsgm1',new Uint8Array(bytes));},[...bytes]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const e=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(e);await cmd(27,e.index);await cmd(22);}
 else{await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const e=(await state()).maps.find(m=>m.name==='Native source wagon proof');assert(e);await page.locator('#mobile-map-select').selectOption(String(e.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native source wagon proof');await cmd(22);}
 const initial=await ready(),ore=initial.resources[2];
 visits.push(await move(4,30));assert.equal(visits.at(-1).resources[2],ore+5);
 await move(3,32);visits.push(await move(4,30));assert.equal(visits.at(-1).resources[2],ore+5);
 // A private local event resets the source counter solely to exercise native
 // refill. The original OB block and all three original WG commands stay intact.
 await move(5,31);visits.push(await move(4,30));assert.equal(visits.at(-1).resources[2],ore+10);
 const bytes=await readCompletedNativeSave(page,cmd);fs.writeFileSync(out+'/after-wagon.vsgm1',bytes);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Unchanged original Samaritan wagon block: actual5ore, empty repeat, then private counter-reset control and native5ore refill. Not a campaign victory.',engine,originalBlockSha256,fixtureSha256:fixture.sha256,routedWasm,oreBefore:ore,oreAfterVisits:visits.map(s=>s.resources[2]),saveSha256:digest(bytes),dialogs,errors},null,2));
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
