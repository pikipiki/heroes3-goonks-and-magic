/** Private native execution of the unchanged original Ellam removal block. */
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8905',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign207-battle-events';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]);
const original=readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc2.vcmp'),program=JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/zc2-2.json'));
const sourceBlocks=program.blocks.filter(b=>b.receiver==='BA'||(b.receiver==='FU'&&b.selectors[0]?.number>=800&&b.selectors[0]?.number<=816));
assert.equal(sourceBlocks.filter(b=>b.receiver==='BA').length,2);
const originalBlocksSha256=digest(JSON.stringify(sourceBlocks));
const trigger=(receiver,selectors,commands)=>({kind:'trigger',receiver,selectors,conditions:[],commands});
const local=(index,access='read')=>({kind:'variable',space:'y',index:n(index),access});
const scriptBattle=[command('VR',[local(201)],'S',[{kind:'variable',space:'x',index:n(1),access:'read'}]),command('HE',[n(-1)],'T',[n(12),n(11),n(0),n(0),n(10)]),command('HE',[n(-1)],'F',[v(31,'write'),v(32,'write'),v(33,'write'),v(34,'write')]),command('VR',[v(35)],'S',[{kind:'variable',space:'w',index:n(10),access:'read'}]),message('OUTER AFTER %V31/%V32/%V33/%V34 DOSES %V35 LOCAL %Y201')];
const potion=Number(process.env.BATTLE_POTION??1);assert(potion===0||potion===1);
const probe=[command('HE',[n(-1)],'F',[v(76,'write'),v(77,'write'),v(78,'write'),v(79,'write')]),command('BA',[],'H',[n(0),v(70,'write')]),command('BA',[],'H',[n(1),v(71,'write')]),command('BA',[],'M',[n(1),n(0),v(72,'write'),v(73,'write')]),command('BA',[],'M',[n(1),n(6),v(74,'write'),v(75,'write')]),command('BA',[],'M',[n(1),n(0),n(0),n(8)]),message('BATTLE PROBE %V70/%V71 TYPE %V72 COUNT %V73 EMPTY %V74/%V75 PRIMARY %V76/%V77/%V78/%V79')];
const fixture={originalMessages:['ZVSE private original battle potion control'],initializers:[command('IF',[],'W',[n(0)]),command('VR',[{kind:'variable',space:'w',index:n(10),access:'read'}],'S',[n(potion)]),message('BATTLE READY')],blocks:[...structuredClone(sourceBlocks),trigger('BA',[n(0)],probe),trigger('BA',[n(1)],[message('POST BATTLE BARRIER')]),trigger('LE',[n(12),n(11),n(0)],[command('FU',[n(900)],'P',[n(42)])]),trigger('FU',[n(900)],scriptBattle)]};
const triggerLocals=process.env.BATTLE_TRIGGER_LOCALS==='1';
if(triggerLocals){
 // 358f has distinct positive FU/DO locals and negative trigger locals.
 // These permanent controls wrap, without rewriting, the original potion blocks.
 const set=(to,from)=>command('VR',[to],'S',[from]);
 const main=fixture.blocks.find(b=>b.receiver==='LE'),body=fixture.blocks.find(b=>b.receiver==='FU'&&b.selectors[0]?.number===900);
 main.commands.unshift(set(local(-1),n(7)));
 main.commands.push(set(v(86),local(-1)),message('TRIGGER LOCALS NESTED %V82/%V83/%V84/%V85/%V86/%V87/%V88'));
 body.commands.unshift(set(v(82),local(-1)),set(local(-1),n(99)),command('FU',[n(901)],'P'),set(v(84),local(-1)));
 body.commands.push(set(v(87),local(-1)));
 const boundary=trigger('LE',[n(12),n(11),n(0)],[set(v(80),local(-1)),set(v(81),local(1)),message('TRIGGER LOCALS BOUNDARY %V80/%V81')]);
 boundary.conditions=[{any:[{left:local(-1),comparison:'=',right:n(0)}]}];
 fixture.blocks.unshift(trigger('LE',[n(12),n(11),n(0)],[set(local(-1),n(44)),set(local(1),n(55)),message('TRIGGER LOCALS BEFORE')]),boundary);
 fixture.blocks.push(trigger('FU',[n(900)],[set(v(85),local(-1)),set(v(88),local(201))]),trigger('FU',[n(901)],[set(v(83),local(-1)),set(local(-1),n(35))]));
}
fixture.sha256=digest(JSON.stringify(fixture));
const base=readZip(fs.readFileSync('maps/003-Goonks-WoG.vmap')),header=JSON.parse(base['header.json']),objects=JSON.parse(base['objects.json']);
let heroTemplate,eventTemplate;for(const m of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps)for(const o of Object.values(parseJsonc(m.map['objects.json'].toString()))){if(o.type==='hero')heroTemplate??=o.template;if(o.type==='event')eventTemplate??=structuredClone(o);}assert(heroTemplate&&eventTemplate);
header.name='Native original battle potions';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};header.players.red.mainTown.generateHero=false;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private battle binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const homes=objects.filter(o=>['redHome','blueHome'].includes(o.instanceName));homes.find(o=>o.instanceName==='blueHome').x=63;homes.find(o=>o.instanceName==='blueHome').y=63;for(const home of homes)home.options.buildings={allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']};
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:12,y:11,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:0,army:[{type:'core:archangel',amount:30}]}};
const event={...eventTemplate,instanceName:'battleEvent',x:12,y:11,l:0,options:{players:['red'],computerActivate:false,humanActivate:true,removeAfterVisit:false}};
const entries={'header.json':header,'objects.json':[...homes,hero,event],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(base['english.json'])};
const map=execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():z.writestr(name,json.dumps(value,separators=(',',':'),ensure_ascii=False))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});fs.writeFileSync(out+'/private-original-battle.vmap',map);
const browser=await (process.env.BATTLE_BROWSER==='webkit'?webkit:chromium).launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],watchdog=setTimeout(()=>browser.close(),240000);page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(out+'/page-errors.log',e.stack+'\n')});page.on('requestfailed',r=>fs.appendFileSync(out+'/requests.log',r.url()+' '+r.failure()?.errorText+'\n'));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text()+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
let routedWasm=0;
if(process.env.CAMPAIGN_ENGINE_PATH)await page.context().route(/\/vcmiclient(?:\.[a-f0-9]+)?\.(js|wasm)(?:\?.*)?$/,route=>{const file=new URL(route.request().url()).pathname.endsWith('.wasm')?'vcmiclient.wasm':'vcmiclient.js';if(file.endsWith('wasm'))routedWasm++;return route.fulfill({path:path.join(process.env.CAMPAIGN_ENGINE_PATH,file),contentType:file.endsWith('wasm')?'application/wasm':'text/javascript',headers:{'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'}});});
await page.addInitScript(({map,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');if(!entry||entry.enabled)throw Error('Expected dormant registry');const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,{initializers:fixture.initializers,blocks:fixture.blocks,originalMessages:fixture.originalMessages,sha256:fixture.sha256});entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Native-battle-potions.vmap',new Uint8Array(map));return invoke.apply(m,args);}});}});},{map:[...map],fixture});

async function centerTile(x,y){
 fs.writeFileSync(out+'/target.json',JSON.stringify({x,y}));
 for(let attempt=0;attempt<30;attempt++){
  const mini=(await state()).mapOverview;await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,5),{x:Math.max(mini.rect.x+1,Math.min(mini.rect.x+mini.rect.w-1,Math.round(mini.rect.x+x*mini.rect.w/mini.width))),y:Math.max(mini.rect.y+1,Math.min(mini.rect.y+mini.rect.h-1,Math.round(mini.rect.y+y*mini.rect.h/mini.height)))});await page.waitForTimeout(150);
  const map=(await state()).mapOverview;if(map.viewport.x===Math.floor(x+0.5-Math.floor(map.view.w/2)/32)&&map.viewport.y===Math.floor(y+0.5-Math.floor(map.view.h/2)/32))return map.view;
 }
 throw Error('Native camera did not settle on '+x+'/'+y);
}

const seen=new Set(),battles=[],observations=[],saveRejections=[];
async function rejectSave(){
 const id=900+saveRejections.length;await page.evaluate(id=>{window.testSaveReply=null;window.addEventListener('goonk-autosave-accepted',e=>{if(e.detail.id===id)window.testSaveReply=e.detail},{once:true});},id);await cmd(34,id);await wait(()=>window.testSaveReply!==null);const reply=await page.evaluate(()=>testSaveReply);assert.equal(reply.accepted,false);saveRejections.push(reply);
}
async function ready(){for(let i=0;i<1400;i++){
 const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));assert.deepEqual(errors,[]);
 if(s.mode==='battle'){
  if(!battles.length){battles.push(s);fs.writeFileSync(out+'/battle.json',JSON.stringify(s,null,2));assert(s.battleUnits.some(u=>u.enemy&&u.key==='core:pikeman'&&u.count===8));}
  if(s.canAutoCombat&&!s.autoCombat)await cmd(44,1);await page.waitForTimeout(150);continue;
 }
 if(s.mode==='dialog'){
  const model=s.dialogPresentation||{},key=s.windowToken+':'+JSON.stringify(model);assert(!JSON.stringify(model).includes('Original script error:'));if(!seen.has(key)){
   seen.add(key);dialogs.push(model);fs.writeFileSync(out+'/dialogs.json',JSON.stringify(dialogs,null,2));const content=JSON.stringify(model);
   if(s.dialogKind==='battle-result'){await cmd(1);continue;}
   if(content.includes('Hydromel')||content.includes('POST BATTLE BARRIER')||content.includes('BATTLE PROBE')){assert.equal(s.autosaveAllowed,false);await rejectSave();}
   if(model.scriptDialog){if(model.scriptDialog.choices?.length)await page.locator('[data-campaign-choice]').first().check();await page.locator('[data-dialog-confirm]').tap();}
   else await cmd(1);
   if(content.includes('OUTER AFTER'))observations.push(content);
  }
 }else if(s.mode==='map'&&s.turn&&!s.campaignPending&&!s.heroMoving&&!s.hasPath){await page.waitForTimeout(400);return s;}
 await page.waitForTimeout(100);
}throw Error('Native battle event did not settle');}
async function heroSnapshot(){await cmd(55);await wait(()=>goonkMobileState.mode==='hero');const s=await state();assert(s.heroWindow?.primarySkills?.length===4);await cmd(63);await ready();return s;}
try{
 const engine=process.env.CAMPAIGN_ENGINE_PATH?{sha256:digest(fs.readFileSync(path.join(process.env.CAMPAIGN_ENGINE_PATH,'vcmiclient.wasm')))}:await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name==='Native original battle potions');assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native original battle potions');await cmd(22);await ready();const before=await heroSnapshot();
 const view=await centerTile(12,11);await page.evaluate(r=>Module._vcmiMobilePointer(Math.round(r.x+r.w/2),Math.round(r.y+r.h/2),1),view);await wait(()=>goonkMobileState.hasPath||goonkMobileState.mode==='dialog');await cmd(2);await ready();
 if(triggerLocals){assert(dialogs.some(d=>JSON.stringify(d).includes('TRIGGER LOCALS BOUNDARY 0/55')));assert(dialogs.some(d=>JSON.stringify(d).includes('TRIGGER LOCALS NESTED 7/99/99/7/7/99/42')));}assert.equal(battles.length,1);assert.equal(observations.length,1);assert(observations[0].includes('DOSES 0 LOCAL 42'));assert(dialogs.some(d=>JSON.stringify(d).includes('BATTLE PROBE 0/-2 TYPE 0 COUNT 10 EMPTY -1/0')));assert(dialogs.some(d=>JSON.stringify(d).includes('POST BATTLE BARRIER')));assert(saveRejections.length>=2);
 const after=await heroSnapshot();assert.deepEqual(after.heroWindow.primarySkills,before.heroWindow.primarySkills);
 const own=battles[0].battleUnits.find(u=>!u.enemy&&u.key==='core:archangel');
 const expectedPrimary=before.heroWindow.primarySkills.map((n,i)=>n+(i<2?potion*2:0));assert(dialogs.some(d=>JSON.stringify(d).includes('PRIMARY '+expectedPrimary.join('/'))));
 if(process.env.BATTLE_BASELINE_RESULT){const baseline=JSON.parse(fs.readFileSync(process.env.BATTLE_BASELINE_RESULT));assert.equal(baseline.potion,0);assert.equal(own.attack-before.heroWindow.primarySkills[0],baseline.battleAttack-baseline.before.primarySkills[0]+potion*2);assert.equal(own.defense-before.heroWindow.primarySkills[1],baseline.battleDefense-baseline.before.primarySkills[1]+potion*2);}

 const bytes=await readCompletedNativeSave(page,cmd);fs.writeFileSync(out+'/after-battle.vsgm1',bytes);
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Unchanged original zc2 potion BA0/BA1 and FU800..816 on private flat map with controlled player army; real nested HE:T battle, dialog barriers and source dose/stat restoration, not a campaign victory.',potion,triggerLocals,engine,sourceArchiveSha256:original.sha256,sourceProgramSha256:program.sha256,originalBlocksSha256,fixtureSha256:fixture.sha256,routedWasm,before:before.heroWindow,after:after.heroWindow,battleAttack:own.attack,battleDefense:own.defense,saveRejections,observations,dialogs,errors},null,2));
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
