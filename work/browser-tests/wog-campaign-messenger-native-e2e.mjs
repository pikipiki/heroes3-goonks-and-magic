/** Private messenger dwelling controls; never changes a published map or registry. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign201-messenger';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]);

const dw=(code,args)=>command('DW',[n(21),n(18),n(0)],code,args),ob=(code)=>command('OB',[n(21),n(18),n(0)],code,[{kind:'default',access:'read'}]);
const when=(c,operator,value)=>({...c,conditions:[{any:[{left:v(900),comparison:operator,right:n(value)}]}]});
const fixture={originalMessages:['ZVSE private source messenger date control'],initializers:[
 command('UN',[],'I',[n(22),n(18),n(0),n(17),n(93)]),dw('M',[n(0),v(810,'write'),v(811,'write')]),message('MESSENGER created %V810/%V811'),
 dw('M',[n(0),n(164),n(7)]),dw('G',[n(0),n(7),n(1)]),dw('G',[n(4),n(0),n(2)])],blocks:[{receiver:'OB',selectors:[n(17),n(93)],kind:'trigger',conditions:[],commands:[
 command('VR',[v(900)],'+',[n(1)]),dw('M',[n(0),v(812,'write'),v(813,'write')]),dw('G',[n(0),v(814,'write'),v(815,'write')]),dw('G',[n(4),v(816,'write'),v(817,'write')]),
 message('MESSENGER visit %V900: %V812/%V813 guard %V814/%V815 extra %V816/%V817'),
 when(dw('M',[n(0),n(159),n(3)]),'<=',4),when(ob('S'),'<=',4),when(ob('R'),'=',5)]}]};
fixture.sha256=digest(JSON.stringify(fixture));
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']);
let heroTemplate;
for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;}
assert(heroTemplate);header.name='Native source messenger proof';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private source binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:18,y:18,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1,experience:0,army:[{type:'core:archangel',amount:2500}]}};
const entries={'header.json':header,'objects.json':[...homes,hero],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const map=execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});fs.writeFileSync(out+'/private-source-messenger.vmap',map);

const browser=await (process.env.MESSENGER_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],watchdog=setTimeout(()=>browser.close(),240000);page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(out+'/page-errors.log',e.stack+'\n')});page.on('requestfailed',r=>fs.appendFileSync(out+'/requests.log',r.url()+' '+r.failure()?.errorText+'\n'));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text()+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
let routedWasm=0;
if(process.env.CAMPAIGN_ENGINE_PATH)await page.context().route(/\/vcmiclient(?:\.[a-f0-9]+)?\.(js|wasm)(?:\?.*)?$/,route=>{const file=new URL(route.request().url()).pathname.endsWith('.wasm')?'vcmiclient.wasm':'vcmiclient.js';if(file.endsWith('wasm'))routedWasm++;return route.fulfill({path:path.join(process.env.CAMPAIGN_ENGINE_PATH,file),contentType:file.endsWith('wasm')?'application/wasm':'text/javascript',headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'}});});
await page.addInitScript(({map,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');if(!entry||entry.enabled)throw Error('Expected dormant registry');const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,{initializers:fixture.initializers,blocks:fixture.blocks,originalMessages:fixture.originalMessages,sha256:fixture.sha256});entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Native-quest-rules.vmap',new Uint8Array(map));return invoke.apply(m,args);}});}});},{map:[...map],fixture});


try{
 console.log('Messenger browser ready');const engine=process.env.CAMPAIGN_ENGINE_PATH?{sha256:digest(fs.readFileSync(path.join(process.env.CAMPAIGN_ENGINE_PATH,'vcmiclient.wasm')))}:await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 console.log('Messenger navigating',origin);await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 if(process.env.MESSENGER_LOAD_SAVE){const bytes=fs.readFileSync(process.env.MESSENGER_LOAD_SAVE);assert.equal(digest(bytes),process.env.MESSENGER_EXPECTED_SAVE_SHA);await page.evaluate(bytes=>{const root='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(root);Module.FS.writeFile(root+'Goonk-auto.vsgm1',new Uint8Array(bytes));},[...bytes]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);}
 else{await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name==='Native source messenger proof');assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native source messenger proof');await cmd(22);}
 const observations=[],seen=new Set();let midpointSha256;
 const token=s=>s.windowToken+':'+JSON.stringify(s.dialogPresentation);
 async function ack(s){const t=token(s);if(seen.has(t))return;seen.add(t);dialogs.push(s.dialogPresentation);await cmd(1);await page.waitForTimeout(200);}
 async function ready(){for(let i=0;i<1200;i++){const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));assert.deepEqual(errors,[]);assert(!JSON.stringify(s.dialogPresentation||{}).includes('Original script error:'));if(s.mode==='map'&&s.turn&&!s.campaignPending&&!s.heroMoving&&!s.hasPath){await page.waitForTimeout(600);if((await state()).mode==='map')return s;}if(s.mode==='dialog')await ack(s);await page.waitForTimeout(100);}throw Error('Messenger map not ready');}
 async function target(x,y){await ready();const mini=(await state()).mapOverview;await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,5),{x:Math.round(mini.rect.x+x*mini.rect.w/mini.width),y:Math.round(mini.rect.y+y*mini.rect.h/mini.height)});await page.waitForTimeout(300);const view=(await state()).mapOverview.view;await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(view.x+view.w/2),y:Math.round(view.y+view.h/2)});await wait(()=>goonkMobileState.hasPath||goonkMobileState.mode==='dialog');if((await state()).mode==='map')await cmd(2);}
 async function observe(visit){const expectedType=164+visit%4,expectedCount=visit===1?7:3;for(let i=0;i<1000;i++){const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));assert.deepEqual(errors,[]);assert(!JSON.stringify(s.dialogPresentation||{}).includes('Original script error:'));if(s.mode==='dialog'){const lines=s.dialogPresentation?.lines?.join(' ')||'';if(lines.includes('MESSENGER visit '+visit+':')){assert.equal(s.day,visit);assert(lines.includes(expectedType+'/'+expectedCount+' guard '+expectedType+'/10 extra 0/2'),lines);observations.push(s);return s;}await ack(s);}await page.waitForTimeout(100);}throw Error('Missing messenger visit '+visit);}
 let start=1;
 if(process.env.MESSENGER_LOAD_SAVE){const pending=await observe(2);await ack(pending);await ready();start=3;}
 else{await ready();assert(dialogs.some(d=>d.lines?.join(' ').includes('MESSENGER created 164/2')));}
 for(let visit=start;visit<=5;visit++){
  if(visit>1){await target(20,19);await ready();const day=(await state()).day;await cmd(3);await wait(day=>goonkMobileState.day>day||goonkMobileState.mode==='dialog',day);await ready();}
  await target(21,18);const s=await observe(visit);
  if(visit===2&&!process.env.MESSENGER_LOAD_SAVE){const bytes=await readCompletedNativeSave(page,cmd);fs.writeFileSync(out+'/messenger-pending.vsgm1',bytes);midpointSha256=digest(bytes);}
  await ack(s);if(visit<5)await ready();
 }
 let battle;for(let i=0;i<1200;i++){const s=await state();if(s.mode==='dialog')await ack(s);if(s.mode==='battle'&&s.round>0&&s.battleUnits?.length){battle=s;break;}await page.waitForTimeout(100);}
 assert(battle,'The restored messenger guards must enter a real positive battle round');assert.equal(battle.battleUnits.filter(u=>u.enemy&&u.key==='wake-of-gods.messengersandemissaries:earthMessenger').reduce((n,u)=>n+u.count,0),10);assert.equal(battle.battleUnits.filter(u=>u.enemy&&u.key==='core:pikeman').reduce((n,u)=>n+u.count,0),2);assert.equal(battle.battleUnits.filter(u=>u.enemy).reduce((n,u)=>n+u.count,0),12,'No duplicate guards from dwelling initialization');
 assert.deepEqual(errors,[]);if(process.env.CAMPAIGN_ENGINE_PATH)assert(routedWasm>0);await page.screenshot({path:out+'/messenger-native-battle.png'});fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Private unchanged native mechanics: created 17/93 default Fire, day-dependent recruit and guard correction before source OB, preserved recruit count and other guard slots, source override after correction, pending save/reload, actual positive battle round; not an original quest or campaign victory.',engine,fixtureSha256:fixture.sha256,routedWasm,midpointSha256,observations,battle,dialogs,errors},null,2));
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
