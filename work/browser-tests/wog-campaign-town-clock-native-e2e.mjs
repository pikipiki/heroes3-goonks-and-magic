/** Private native original player countdown and actual loss control. Published map/registry stay unchanged. */
import {chromium} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {readOriginalCampaign,readZip} from '../../scripts/era-bridge/campaigns/importer.mjs';
import {parseJsonc} from '../../scripts/era-bridge/artifacts/importer.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8877',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign185-town-clock';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex'),n=number=>({kind:'number',access:'read',number}),v=(index,access='read')=>({kind:'variable',space:'v',index:n(index),access}),text=text=>({kind:'string',access:'read',text});
const command=(receiver,selectors,code,args=[])=>({receiver,selectors,conditions:[],operations:[{code,args}]}),message=t=>command('IF',[],'M',[text(t)]),key=(player,state)=>command('OW',[],'K',[n(player),n(3),state]);
const restore=process.env.CLOCK_RESTORE==='1';
const fixture={originalMessages:['ZVSE private native town clock '+restore],initializers:[command('OW',[],'D',[n(0),n(254)]),command('TM',[n(1)],'S',[n(10),n(10),n(1),n(1)]),...(restore?[command('TM',[n(2)],'S',[n(13),n(13),n(1),n(1)])]:[]),message('Native immortal clock configured')],blocks:[{kind:'trigger',receiver:'TM',selectors:[n(1)],conditions:[],commands:[command('OW',[],'D',[n(0),n(4)]),message('Native four day countdown')]},...(restore?[{kind:'trigger',receiver:'TM',selectors:[n(2)],conditions:[],commands:[command('OW',[],'D',[n(0),n(254)]),message('Native immortal clock restored')]}]:[])]};fixture.sha256=digest(JSON.stringify(fixture));fs.writeFileSync(path.join(out,'fixture.json'),JSON.stringify(fixture,null,2));
const base=fs.readFileSync('maps/003-Goonks-WoG.vmap');assert.equal(digest(base),'7d4505207d2b0c3203b11a6592ab7d8587377e415a33fa0130bb6113193c345b');
const members=readZip(base),header=JSON.parse(members['header.json']),originalObjects=JSON.parse(members['objects.json']);
let blueTemplate,heroTemplate;
for(const map of readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc4.vcmp').maps)for(const obj of Object.values(parseJsonc(map.map['objects.json'].toString()))){if(obj.type==='hero')heroTemplate??=structuredClone(obj.template);if(obj.type==='town'&&obj.subtype==='castle')blueTemplate??=structuredClone(obj);}assert(heroTemplate&&blueTemplate);
header.triggeredEvents={standardDefeat:parseJsonc(readOriginalCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp').maps[0].map['header.json'].toString()).triggeredEvents.standardDefeat};
header.name='Native town clock proof';header.description='Private no-town loss policy. No original quest or victory.';header.mapLevels.surface.width=header.mapLevels.surface.height=72;
for(const color of ['red','blue']){header.players[color].canPlay=color==='red'?'PlayerOnly':'AIOnly';header.players[color].allowedFactions={anyOf:['core:castle']};header.players[color].randomFaction=false;}
header.players.blue.mainTown={x:63,y:63,l:0,generateHero:false};delete header.players.red.mainTown;header.players.red.mainHero='privateOrrin';header.players.red.heroes={privateOrrin:{type:'core:orrin'}};
header.events=[{name:'private source binding',firstOccurrence:499,nextOccurrence:0,humanAffected:1,computerAffected:0,players:['red','blue'],message:{exactStrings:fixture.originalMessages,localStrings:null,message:[0],numbers:null,stringsTextID:null}}];
const hero={instanceName:'privateOrrin',type:'hero',subtype:'knight',x:18,y:18,l:0,template:heroTemplate,options:{owner:'red',type:'core:orrin',gender:-1}};
const town={...blueTemplate,instanceName:'blueClock',x:63,y:63,l:0,options:{owner:'blue',buildings:{allOf:['core:villageHall','core:fort'],noneOf:['core:tavern']}}};
const entries={'header.json':header,'objects.json':[hero,town],'surface_terrain.json':Array.from({length:72},()=>Array(72).fill('gr0_')),'english.json':JSON.parse(members['english.json'])};
const map=execFileSync('python3',['-c',`import sys,json,zipfile,io
data=json.load(sys.stdin);out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for name,value in data.items():
  info=zipfile.ZipInfo(name,(2000,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,json.dumps(value,separators=(',',':')))
sys.stdout.buffer.write(out.getvalue())`],{input:JSON.stringify(entries)});fs.writeFileSync(path.join(out,'private-town-clock-control.vmap'),map);
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
const errors=[],dialogs=[],seen=new Set(),watchdog=setTimeout(()=>browser.close(),300000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.type()+': '+m.text().slice(0,2000)+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout}),body=s=>JSON.stringify(s.dialogPresentation||{});
await page.addInitScript(({map,fixture})=>{sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');if(!entry||entry.enabled)throw Error('Expected dormant registry');const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));Object.assign(program,{initializers:fixture.initializers,blocks:fixture.blocks,originalMessages:fixture.originalMessages,sha256:fixture.sha256});entry.enabled=true;entry.programSha256=fixture.sha256;m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Native-town-clock.vmap',new Uint8Array(map));return invoke.apply(m,args);}});}});},{map:[...map],fixture});
const token=s=>s.day+':'+s.currentPlayer+':'+s.windowToken+':'+JSON.stringify(s.dialogPresentation);
async function ack(s){const id=token(s);if(seen.has(id))return;seen.add(id);dialogs.push({day:s.day,player:s.currentPlayer,presentation:s.dialogPresentation});await cmd(1);await page.waitForTimeout(160);}
async function ready(day){const end=Date.now()+180000,ended=new Set();while(Date.now()<end){const s=await state();fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify(s,null,2));if(s.mode==='dialog'){if(s.dialogKind==='source-campaign'&&!seen.has(token(s)))return s;await ack(s);}else if(s.mode==='map'&&s.turn&&!s.campaignPending){if(s.currentPlayer===0&&s.day===day)return s;assert(s.day<=day);const key=s.day+':'+s.currentPlayer;if(!ended.has(key)){ended.add(key);await cmd(3);}}await page.waitForTimeout(100);}throw Error('Native calendar turn did not reach red day'+day);}
async function save(){const file='/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',prior=await page.evaluate(file=>{try{return Module.FS.stat(file).mtime.getTime()}catch{return 0}},file);await cmd(34,185);await wait(({file,prior})=>{try{return Module.FS.stat(file).mtime.getTime()>prior}catch{return false}},{file,prior});const bytes=Buffer.from(await page.evaluate(file=>Array.from(Module.FS.readFile(file)),file));assert.equal(bytes.readInt32LE(4),904);fs.writeFileSync(path.join(out,'town-clock-pending.vsgm1'),bytes);}
try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 if(process.env.CAMPAIGN_LOAD_SAVE){await page.evaluate(bytes=>{Module.FS.mkdirTree('/home/web_user/.local/share/vcmi/Saves');Module.FS.writeFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',new Uint8Array(bytes));},[...fs.readFileSync(process.env.CAMPAIGN_LOAD_SAVE)]);await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(e=>/Goonk-auto/i.test(e.name+' '+e.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);}
 else{await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>m.name==='Native town clock proof');assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='Native town clock proof');await cmd(22);}
 const startDay=process.env.CAMPAIGN_LOAD_SAVE?10:1;const pending=await ready(startDay);assert.equal(pending.dialogKind,'source-campaign');assert(body(pending).includes(startDay===1?'Native immortal clock configured':'Native four day countdown'));assert(pending.autosaveAllowed);await ack(pending);
 const turns=[],sourceMessages=[],warnings=[];
 const endDay=restore?16:13;
 for(let day=startDay;day<=endDay;day++){
  let s=await ready(day);
  if(s.mode==='dialog'){
   sourceMessages.push({day,presentation:s.dialogPresentation});
   if(day===10){assert(body(s).includes('Native four day countdown'));await save();}
   else if(day===13&&restore)assert(body(s).includes('Native immortal clock restored'));else throw Error('Unexpected source checkpoint on '+day);
   await ack(s);s=await ready(day);
  }
  assert.equal(s.mode,'map');assert.equal(s.currentPlayer,0);assert.equal(s.day,day);assert.equal((s.towns||[]).length,0);assert(s.heroes.length>0);turns.push({day,heroCount:s.heroes.length});
 }
 if(!restore){
  await cmd(3);let lost=false;const end=Date.now()+60000;
  while(Date.now()<end){const s=await state();fs.writeFileSync(path.join(out,'loss-progress.json'),JSON.stringify(s,null,2));
   if(s.mode==='menu'){lost=true;break;}
   assert(!(s.mode==='map'&&s.turn&&s.currentPlayer===0&&s.day>=14),'Player survived expired original clock');
   if(s.mode==='dialog'){warnings.push({day:s.day,presentation:s.dialogPresentation});await ack(s);}await page.waitForTimeout(100);
  }assert(lost,'Native loss returns to menu on fourth end turn');
 }
 const deadlineWarnings=dialogs.filter(d=>(d.presentation.lines||[]).some(t=>/days left to capture|last day to capture/.test(t)));
 assert.deepEqual(deadlineWarnings.map(d=>d.day),restore?[10,11,12]:[10,11,12,13]);
 for(const [day,remaining]of [[10,4],[11,3],[12,2]])assert(deadlineWarnings.some(d=>d.day===day&&body({dialogPresentation:d.presentation}).includes(`${remaining} days left to capture`)));
 if(!restore)assert(deadlineWarnings.some(d=>d.day===13&&body({dialogPresentation:d.presentation}).includes('last day to capture')));
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,scope:'Private OW:D254 survives native no-town limit, OW:D4 expires after four actual end turns; optional restoration before expiry; pending save/reload. No original quest or victory.',engine,restore,loadedPending:!!process.env.CAMPAIGN_LOAD_SAVE,fixtureSha256:fixture.sha256,mapSha256:digest(map),turns,sourceMessages,dialogs,warnings,errors},null,2));
}catch(error){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error;}finally{clearTimeout(watchdog);await browser.close();}
