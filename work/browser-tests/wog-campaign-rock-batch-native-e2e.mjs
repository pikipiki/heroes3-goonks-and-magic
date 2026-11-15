/** Private native execution of the unchanged original Ellam removal block. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8905',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign206-rock-batch';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]);
const original=readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc3.vcmp'),program=JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/zc3-0.json'));
const block=program.blocks.find(b=>b.receiver==='LE'&&b.selectors.map(a=>a.number).join('/')==='31/59/0');assert(block);assert.equal(block.commands.length,18);
const removals=block.commands.filter(c=>c.receiver==='UN');assert.equal(removals.length,14);
const fixture={originalMessages:['ZVSE private original Ellam batch control'],initializers:[message('BATCH READY')],blocks:[structuredClone(block),{kind:'trigger',receiver:'LE',selectors:[n(31),n(59),n(0)],conditions:[],commands:[message('BATCH AFTER')]}]};fixture.sha256=digest(JSON.stringify(fixture));
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']),sourceObjects=parseJsonc(original.maps[0].map['objects.json'].toString());
const names=['rock_214','rock_215','rock_216','rock_217','rock_218','rock_2272','rock_1556','rock_1557'];const rocks=names.map(name=>({...structuredClone(sourceObjects[name]),instanceName:name}));assert(rocks.every(o=>o.type==='rock'));
const overlays=['mountain_1588','oakTrees_209'].map(name=>({...structuredClone(sourceObjects[name]),instanceName:name}));
const event={...structuredClone(sourceObjects.event_3154),instanceName:'event_3154'};assert.deepEqual([event.x,event.y,event.l],[31,59,0]);
let heroTemplate;for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;}assert(heroTemplate);
header.name='Native original rock batch';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private rock binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:29,y:57,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1,army:[{type:'core:pikeman',amount:2}]}};
const entries={'header.json':header,'objects.json':[...homes,hero,event,...rocks,...overlays],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const map=execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});fs.writeFileSync(out+'/private-original-rock-batch.vmap',map);
const browser=await (process.env.BATCH_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],watchdog=setTimeout(()=>browser.close(),240000);page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(out+'/page-errors.log',e.stack+'\n')});page.on('requestfailed',r=>fs.appendFileSync(out+'/requests.log',r.url()+' '+r.failure()?.errorText+'\n'));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text()+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
let routedWasm=0;
if(process.env.CAMPAIGN_ENGINE_PATH)await page.context().route(/\/vcmiclient(?:\.[a-f0-9]+)?\.(js|wasm)(?:\?.*)?$/,route=>{const file=new URL(route.request().url()).pathname.endsWith('.wasm')?'vcmiclient.wasm':'vcmiclient.js';if(file.endsWith('wasm'))routedWasm++;return route.fulfill({path:path.join(process.env.CAMPAIGN_ENGINE_PATH,file),contentType:file.endsWith('wasm')?'application/wasm':'text/javascript',headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'}});});
await page.addInitScript(({map,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');if(!entry||entry.enabled)throw Error('Expected dormant registry');const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,{initializers:fixture.initializers,blocks:fixture.blocks,originalMessages:fixture.originalMessages,sha256:fixture.sha256});entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Native-rock-batch.vmap',new Uint8Array(map));return invoke.apply(m,args);}});}});},{map:[...map],fixture});

async function centerTile(x,y){
 fs.writeFileSync(out+'/target.json',JSON.stringify({x,y}));
 for(let attempt=0;attempt<30;attempt++){
  const mini=(await state()).mapOverview;await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,5),{x:Math.max(mini.rect.x+1,Math.min(mini.rect.x+mini.rect.w-1,Math.round(mini.rect.x+x*mini.rect.w/mini.width))),y:Math.max(mini.rect.y+1,Math.min(mini.rect.y+mini.rect.h-1,Math.round(mini.rect.y+y*mini.rect.h/mini.height)))});await page.waitForTimeout(150);
  const map=(await state()).mapOverview;if(map.viewport.x===Math.floor(x+0.5-Math.floor(map.view.w/2)/32)&&map.viewport.y===Math.floor(y+0.5-Math.floor(map.view.h/2)/32))return map.view;
 }
 throw Error('Native camera did not settle on '+x+'/'+y);
}

let pendingSaveSha256;const observations=[],seen=new Set();
async function ready(){
 for(let i=0;i<1200;i++){
  const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));assert.deepEqual(errors,[]);
  if(s.mode==='dialog'){
   const model=s.dialogPresentation||{},key=s.windowToken+':'+JSON.stringify(model);assert(!JSON.stringify(model).includes('Original script error:'));
   if(!seen.has(key)){
    seen.add(key);dialogs.push(model);const lines=(model.lines||[]).join(' ');
    if(lines==='BATCH READY'&&!process.env.BATCH_LOAD_SAVE){assert(s.autosaveAllowed);const bytes=await readCompletedNativeSave(page,cmd);assert.equal(bytes.readInt32LE(4),906);pendingSaveSha256=digest(bytes);fs.writeFileSync(out+'/pending-rock-batch.vsgm1',bytes);}
    if(lines.startsWith('BATCH AFTER')){assert.equal(lines,'BATCH AFTER');observations.push(lines);}
    await cmd(1);
   }
  }else if(s.mode==='map'&&s.turn&&!s.campaignPending&&!s.heroMoving&&!s.hasPath){await page.waitForTimeout(400);return s;}
  await page.waitForTimeout(100);
 }
 throw Error('Native rock batch did not settle');
}
async function recordPosition(label,expected){
 await cmd(55);await wait(()=>goonkMobileState.mode==='hero');const s=await state();assert.deepEqual(s.troopDeployment.origin,expected);assert(s.troopDeployment.troops.some(t=>t.maximum>0));fs.writeFileSync(out+'/'+label+'.json',JSON.stringify(s,null,2));await cmd(63);await ready();return s;
}
async function travel(x,y){const view=await centerTile(x,y);await page.evaluate(r=>Module._vcmiMobilePointer(Math.round(r.x+r.w/2),Math.round(r.y+r.h/2),1),view);await wait(()=>goonkMobileState.hasPath||goonkMobileState.mode==='dialog');await cmd(2);await page.waitForTimeout(400);return ready();}
try{
 const engine=process.env.CAMPAIGN_ENGINE_PATH?{sha256:digest(fs.readFileSync(path.join(process.env.CAMPAIGN_ENGINE_PATH,'vcmiclient.wasm')))}:await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 if(process.env.BATCH_LOAD_SAVE){
  const bytes=fs.readFileSync(process.env.BATCH_LOAD_SAVE);assert.equal(digest(bytes),process.env.BATCH_EXPECTED_SAVE_SHA);await page.evaluate(bytes=>{const root='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(root);Module.FS.writeFile(root+'Goonk-auto.vsgm1',new Uint8Array(bytes));},[...bytes]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);
 }else{
  await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name==='Native original rock batch');assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native original rock batch');await cmd(22);
 }
 await ready();const before=await recordPosition('before-obstacles',[28,57,0]);
 const available=(s,x,y)=>s.troopDeployment.targets.find(t=>t.x===x&&t.y===y)?.available;
 assert.equal(available(before,28,58),false);assert.equal(available(before,29,58),false);assert.equal(available(before,29,57),false);assert.equal(available(before,27,57),true);
 for(const [x,y]of[[28,56],[29,56],[30,56],[31,56],[32,57],[32,58],[31,59]])await travel(x,y);
 assert.deepEqual(observations,['BATCH AFTER']);assert(dialogs.some(d=>(d.lines||[]).some(t=>t.includes('You and Ellam spend the day clearing up the mountain path'))));
 const after=await state();assert.equal(after.movement,0,'The original exhaustion command must apply');await cmd(3);await wait(day=>goonkMobileState.day>day&&goonkMobileState.currentPlayer===0&&goonkMobileState.turn,after.day);await ready();
 await travel(30,59);await travel(29,58);await recordPosition('first-cleared-tile',[29,58,0]);await travel(28,58);const hero=await recordPosition('second-cleared-tile',[28,58,0]);
 assert.equal(available(hero,29,58),true);assert.equal(available(hero,29,57),false);assert.equal(available(hero,28,59),false);assert.equal(available(hero,29,59),false);assert.equal(available(hero,27,58),true);
 assert.deepEqual(errors,[]);if(process.env.CAMPAIGN_ENGINE_PATH)assert(routedWasm>0);
 await page.screenshot({path:out+'/native-cleared-passage.png'});fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Exact original Ellam LE31/59 block and original eight rocks, event and neighbouring mountain/tree templates on a private flat map; all fourteen source removals, original exhaustion and actual passage crossing. Not an original campaign victory.',engine,sourceArchiveSha256:original.sha256,originalProgramSha256:program.sha256,originalBlockSha256:digest(JSON.stringify(block)),fixtureSha256:fixture.sha256,originalRemovalCount:removals.length,originalRockNames:names,untouchedOriginalOverlays:overlays.map(o=>o.instanceName),routedWasm,pendingSaveSha256,loadedPending:!!process.env.BATCH_LOAD_SAVE,observations,physicalChecks:{bothTilesInitiallyBlocked:true,bothTilesActuallyOccupiedAfterClearing:true,mountainAndOakTreeStillBlock:true,freeControlTilesAvailable:true},finalPosition:hero.troopDeployment.origin,dialogs,errors},null,2));
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
