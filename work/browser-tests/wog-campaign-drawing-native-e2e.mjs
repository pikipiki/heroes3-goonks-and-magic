/** Private original drawing-depth control; never changes a published map or registry. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign203-drawing';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]);

const ob=(x,y,index)=>command('OB',[n(x),n(y),n(0)],'T',[v(index,'write')]);
const remove=(x,y)=>command('UN',[],'O',[n(x),n(y),n(0)]);
const fixture={originalMessages:['ZVSE private source drawing-depth control'],initializers:[
 ob(20,18,800),ob(23,19,801),message('DRAW before %V800/%V801'),
 remove(22,18),ob(20,18,802),ob(23,19,803),message('DRAW after town %V802/%V803'),
 remove(24,19),ob(23,19,804),message('DRAW after mine %V804')],blocks:[]};
fixture.sha256=digest(JSON.stringify(fixture));
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']);
let heroTemplate;
for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;}
assert(heroTemplate);header.name='Native source drawing proof';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private drawing binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:18,y:18,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1,experience:0,army:[{type:'core:archangel',amount:2500}]}};
const originalObjects=parseJsonc(readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps[0].map['objects.json'].toString());
const mine={...originalObjects.mine_1895,instanceName:'mine_1895',x:24,y:19},town={...originalObjects.town_1896,instanceName:'town_1896',x:22,y:18};town.options={owner:'neutral',name:'Private overlap town'};
const entries={'header.json':header,'objects.json':[...homes,hero,mine,town],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const map=execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});fs.writeFileSync(out+'/private-source-drawing.vmap',map);

const browser=await (process.env.DRAWING_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],watchdog=setTimeout(()=>browser.close(),240000);page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(out+'/page-errors.log',e.stack+'\n')});page.on('requestfailed',r=>fs.appendFileSync(out+'/requests.log',r.url()+' '+r.failure()?.errorText+'\n'));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text()+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
let routedWasm=0;
if(process.env.CAMPAIGN_ENGINE_PATH)await page.context().route(/\/vcmiclient(?:\.[a-f0-9]+)?\.(js|wasm)(?:\?.*)?$/,route=>{const file=new URL(route.request().url()).pathname.endsWith('.wasm')?'vcmiclient.wasm':'vcmiclient.js';if(file.endsWith('wasm'))routedWasm++;return route.fulfill({path:path.join(process.env.CAMPAIGN_ENGINE_PATH,file),contentType:file.endsWith('wasm')?'application/wasm':'text/javascript',headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'}});});
await page.addInitScript(({map,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');if(!entry||entry.enabled)throw Error('Expected dormant registry');const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,{initializers:fixture.initializers,blocks:fixture.blocks,originalMessages:fixture.originalMessages,sha256:fixture.sha256});entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Native-quest-rules.vmap',new Uint8Array(map));return invoke.apply(m,args);}});}});},{map:[...map],fixture});


try{
 console.log('Drawing browser ready');const engine=process.env.CAMPAIGN_ENGINE_PATH?{sha256:digest(fs.readFileSync(path.join(process.env.CAMPAIGN_ENGINE_PATH,'vcmiclient.wasm')))}:await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 console.log('Drawing navigating',origin);await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 if(process.env.DRAWING_LOAD_SAVE){const bytes=fs.readFileSync(process.env.DRAWING_LOAD_SAVE);assert.equal(digest(bytes),process.env.DRAWING_EXPECTED_SAVE_SHA);await page.evaluate(bytes=>{const root='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(root);Module.FS.writeFile(root+'Goonk-auto.vsgm1',new Uint8Array(bytes));},[...bytes]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);}
 else{await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name==='Native source drawing proof');assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native source drawing proof');await cmd(22);}
 const observations=[],seen=new Set();let pendingSaveSha256;
 for(let i=0;i<1200;i++){
  const current=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(current,null,2));assert.deepEqual(errors,[]);assert(!JSON.stringify(current.dialogPresentation||{}).includes('Original script error:'));
  if(current.mode==='dialog'){
   const token=current.windowToken+':'+JSON.stringify(current.dialogPresentation);if(seen.has(token)){await page.waitForTimeout(100);continue;}seen.add(token);
   const lines=current.dialogPresentation?.lines?.join(' ')||'';dialogs.push(current.dialogPresentation);
   if(lines.startsWith('DRAW ')){
    const expected=['DRAW before 98/53','DRAW after town -1/53','DRAW after mine -1'][observations.length];
    if(process.env.DRAWING_LOAD_SAVE&&observations.length===0)assert.equal(lines,'DRAW before 98/53');else assert.equal(lines,expected);
    observations.push(lines);
    if(observations.length===1&&!process.env.DRAWING_LOAD_SAVE){assert(current.autosaveAllowed);const bytes=await readCompletedNativeSave(page,cmd);pendingSaveSha256=digest(bytes);fs.writeFileSync(out+'/pending-drawing.vsgm1',bytes);}
   }
   await cmd(1);await page.waitForTimeout(200);
  }else if(current.mode==='map'&&current.turn&&!current.campaignPending&&observations.length===3)break;
  await page.waitForTimeout(100);
 }
 assert.deepEqual(observations,['DRAW before 98/53','DRAW after town -1/53','DRAW after mine -1']);assert.deepEqual(errors,[]);if(process.env.CAMPAIGN_ENGINE_PATH)assert(routedWasm>0);
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Actual original zc1-0 town/mine templates translated together to a private empty map. Native UN:O on their overlapping blocked footprints removes the town first, retains the mine, then removes the mine at its own footprint. Not an original scenario victory.',engine,fixtureSha256:fixture.sha256,routedWasm,pendingSaveSha256,observations,dialogs,errors},null,2));
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
