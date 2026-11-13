import{installReviewedWayfarer260Overlay}from'./wayfarer260-overlay.mjs';
import {readEraArchive} from '../../scripts/era-bridge/resources.mjs';
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-wayfarer260-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8797';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>window.goonkMobileState??null);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util,copy
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
hero=next(o for o in objects if o['instanceName']=='goonkHero');hero['x']=15;hero['y']=15
hero['options'].update({'type':'core:christian','primarySkills':{'attack':4,'defence':7,'spellpower':10,'knowledge':20},'secondarySkills':opts.get('skills',{}),'spellBook':['preset'],'artifacts':dict({'spellbook':'core:spellBook'},**opts.get('artifacts',{})),'army':[{'type':'core:imp','amount':1}]})
if opts.get('second'):
 other=copy.deepcopy(hero);other.update({'instanceName':'secondHero','x':21,'y':16});other['options']['type']='core:adela';other['options']['artifacts']={'spellbook':'core:spellBook'};objects.append(other)
enemy={'type':'core:hero','subtype':'core:knight','instanceName':'enemyHero','x':25,'y':25,'l':0,'template':hero['template'],'options':{'owner':'blue','type':'core:orrin','primarySkills':{'attack':4,'defence':7,'spellpower':10,'knowledge':20},'secondarySkills':opts.get('aiSkills',{}),'artifacts':opts.get('aiArtifacts',{}),'army':[{'type':'core:imp','amount':1}]}};objects.append(enemy)
terrain=json.loads(entries['surface_terrain.json']);terrain=[[opts.get('terrainTile',opts.get('terrain','sw')+'0_') for tile in row] for row in terrain]
if opts.get('sea'):
 hero['x']=4;hero['y']=4;enemy['x']=10;enemy['y']=11
 for y in range(7,18):
  for x in range(10,21):terrain[y][x]='wt0_'
 objects.append({'type':'core:boat','subtype':'core:boatCastle','instanceName':'wayfarerBoat','x':10,'y':11,'l':0,'template':{'animation':'AB02_.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}})
entries['surface_terrain.json']=json.dumps(terrain).encode();entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['name']='000 - Wayfarer validation';h['allowedArtifacts']={'anyOf':['core:speculum']};entries['header.json']=json.dumps(h).encode()
for n in ['english.json','french.json']:
 t=json.loads(entries[n]);t['mapName']='000 - Wayfarer validation';entries[n]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(options)]);
async function boot(options){console.log('BOOT',JSON.stringify(options));p=await browser.newPage({viewport:JSON.parse(process.env.VIEWPORT||'{"width":844,"height":390}'),hasTouch:true,bypassCSP:true});await silenceTestAudio(p);if(process.env.WAYFARER_DESKTOP)await p.addInitScript(()=>window.addEventListener('goonk-state',event=>{window.goonkMobileState=event.detail;}));await installReviewedWayfarer260Overlay(p,process.env.WAYFARER_REVIEW||'/tmp/goonk156-wayfarer260-review-final',{controls:options.controls||{},noCommanders:true});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(consoleLines.length<4000)consoleLines.push((m.type()+': '+m.text()).slice(0,1000));});await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile='+(process.env.WAYFARER_DESKTOP?'0':'1'));await wait(()=>{if(location.search.includes('mobile=0'))window.Module?._vcmiMobileEnable?.(2);return window.goonkMobileState?.mode==='menu'&&(location.search.includes('mobile=0')||window.goonkSessionRecovery?.phase==='done');},null,240000);if(options.menuOnly)return;await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Wayfarer validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);if(process.env.WAYFARER_DESKTOP)await p.mouse.move(500,400);console.log('MAP READY');}
async function controlAi(){
 await cmd(55);await wait(()=>goonkMobileState.mode==='hero');await cmd(63);await wait(()=>goonkMobileState.mode==='map');
 const before=await state(),css=await p.evaluate(()=>{Module._vcmiMobileEnable(2);const c=Module.canvas,s=c.style.cssText;c.style.setProperty('visibility','visible','important');if(!location.search.includes('mobile=0')){c.style.position='absolute';c.style.left='-9999px';}c.tabIndex=0;c.focus();return s;});await p.waitForTimeout(200);
 // CGStatusBar::clickPressed opens the existing console directly. This avoids
 // browser Tab focus traversal and does not add a native diagnostic entrypoint.
 await p.evaluate(rect=>Module._vcmiMobilePointer(rect.x+100,rect.y+rect.h-35,1),before.rect);await p.waitForTimeout(200);await p.evaluate(()=>Module.canvas.focus());
 await p.screenshot({path:path.join(out,'console-entered-dom.png')});fs.writeFileSync(path.join(out,'console-entered.png'),Buffer.from((await p.evaluate(()=>Module.canvas.toDataURL())).split(',')[1],'base64'));
 await p.keyboard.type('/controlai blue',{delay:20});await p.waitForTimeout(200);await p.screenshot({path:path.join(out,'console-typed-dom.png')});fs.writeFileSync(path.join(out,'console-typed.png'),Buffer.from((await p.evaluate(()=>Module.canvas.toDataURL())).split(',')[1],'base64'));await cmd(1);await p.waitForTimeout(700);await p.evaluate(css=>{Module.canvas.style.cssText=css;Module._vcmiMobileEnable(location.search.includes('mobile=0')?2:1);},css);await p.waitForTimeout(300);
}

async function endToOtherHero(old){await cmd(3);await wait(old=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.heroId!==old,old);return state();}
async function nextAiDay(blue){await endToOtherHero(blue);const red=(await state()).heroId;await endToOtherHero(red);return state();}
async function equipmentMove(from,to){await cmd(55);await wait(()=>goonkMobileState.mode==='hero');await cmd(62,from);await p.waitForTimeout(200);await cmd(62,to);await p.waitForTimeout(300);await cmd(63);await wait(()=>goonkMobileState.mode==='map');}
async function aiFollowups(){
 const blue=(await state()).heroId,observations={};
 const collect=async name=>{const s=await state(),h=s.heroes.find(h=>h.id===s.heroId);const observation=observations[name]={day:s.day,movement:s.movement,limit:h.movementLimit};console.log('FOLLOWUP',name,JSON.stringify(observation));return observation;};
 await nextAiDay(blue);assert.deepEqual(await collect('day2'),{day:2,movement:2030,limit:2030});
 await cmd(7);await wait(()=>{try{return Module.FS.readdir('/home/web_user/.local/share/vcmi/Saves').some(n=>n.startsWith('Goonk-mobile'));}catch{return false;}});await p.waitForTimeout(500);
 const saves=await p.evaluate(()=>{const r='/home/web_user/.local/share/vcmi/Saves';return Module.FS.readdir(r).filter(n=>n.startsWith('Goonk-mobile')).map(name=>({name,bytes:Array.from(Module.FS.readFile(r+'/'+name))}));});
 const pattern=Buffer.from([3,4,1,0x84,2,2,0]); /* BinarySerializer variant3/vector4/[1,260,day2,land0]. */
 observations.serializedReceipt=saves.map(f=>{const b=Buffer.from(f.bytes);fs.writeFileSync(path.join(out,f.name),b);let count=0,index=-1;while((index=b.indexOf(pattern,index+1))>=0)count++;return{name:f.name,bytes:b.length,receiptPatterns:count};});assert(observations.serializedReceipt.some(f=>f.receiptPatterns>=2));await wait(()=>goonkMobileState.mode==='dialog');await cmd(1);await wait(()=>goonkMobileState.mode==='map');
 await equipmentMove(8,19);assert.deepEqual(await collect('unequippedDay2'),{day:2,movement:2030,limit:2030});
 await nextAiDay(blue);assert.deepEqual(await collect('day3'),{day:3,movement:1630,limit:1630});
 await equipmentMove(19,8);assert.deepEqual(await collect('reequippedDay3'),{day:3,movement:1630,limit:1630});
 await nextAiDay(blue);assert.deepEqual(await collect('day4'),{day:4,movement:2030,limit:2030});
 return observations;
}
async function walkEast(offset=64){const before=await state();await cmd(6);if(process.env.WAYFARER_MAP_CENTER)await p.evaluate(([x,y])=>{const m=goonkMobileState.mapOverview;Module._vcmiMobilePointer(m.rect.x+(x+.5)*m.rect.w/m.width,m.rect.y+(y+.5)*m.rect.h/m.height,5);},JSON.parse(process.env.WAYFARER_MAP_CENTER));await p.waitForTimeout(300);await p.evaluate(offset=>{const v=goonkMobileState.mapOverview.view;Module._vcmiMobilePointer(v.x+v.w/2+offset,v.y+v.h/2,1);},offset);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='map'&&!goonkMobileState.hasPath&&!goonkMobileState.heroMoving);const after=await state();return{before:before.movement,after:after.movement,cost:before.movement-after.movement,hero:after.heroes.find(h=>h.id===after.heroId)};}
async function humanSaveLoad(c){
 const old=await state();await cmd(7);await wait(()=>goonkMobileState.mode==='dialog');
 const files=await p.evaluate(()=>{const root='/home/web_user/.local/share/vcmi/Saves';return Module.FS.readdir(root).filter(n=>n.startsWith('Goonk-mobile')).map(name=>({name,bytes:Array.from(Module.FS.readFile(root+'/'+name))}));});assert(files.length);
 await p.close();await boot({...c,menuOnly:true});await p.evaluate(files=>{const root='/home/web_user/.local/share/vcmi/Saves';Module.FS.mkdirTree(root);for(const f of files)Module.FS.writeFile(root+'/'+f.name,new Uint8Array(f.bytes));},files);
 await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const saved=(await state()).maps.find(m=>/Goonk-mobile/i.test(m.name+' '+m.file));assert(saved);await cmd(27,saved.index);await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);const loaded=await state();assert.equal(loaded.movement,old.movement);assert.equal(loaded.heroes.find(h=>h.id===loaded.heroId).movementLimit,1630);const move=await walkEast();assert.equal(move.cost,200);return{savedMovement:old.movement,loadedMovement:loaded.movement,limit:1630,subsequentMove:move.cost,saveBytes:files.reduce((n,f)=>n+f.bytes.length,0)};
}
async function seaFollowups(c){
 const blue=(await state()).heroId;
 const collect=async()=>{const s=await state();return{day:s.day,movement:s.movement,limit:s.heroes.find(h=>h.id===s.heroId).movementLimit};};
 const board=await walkEast(32),afterBoard=await collect();if(c.returnSameDay){const disembark=await walkEast(-32),afterDisembark=await collect();assert.equal(afterDisembark.day,1);assert.equal(afterDisembark.limit,1630);await nextAiDay(blue);const nextLandDay=await collect();assert.equal(nextLandDay.limit,2030);return{board,afterBoard,disembark,afterDisembark,nextLandDay};}await nextAiDay(blue);const nextSeaDay=await collect();
 const disembark=await walkEast(-32),afterDisembark=await collect();await nextAiDay(blue);const nextLandDay=await collect();
 return{board,afterBoard,nextSeaDay,disembark,afterDisembark,nextLandDay};
}
const cases=[{name:'human-other-hero',second:true,artifacts:{feet:'tum-era:artifact260'}},{name:'human-baseline'},{name:'human-worn',artifacts:{feet:'tum-era:artifact260'}},{name:'human-backpack',artifacts:{backpack:['tum-era:artifact260']}},{name:'human-basic-worn',artifacts:{feet:'tum-era:artifact260'},skills:{'core:pathfinding':'basic'}},{name:'human-expert-worn',artifacts:{feet:'tum-era:artifact260'},skills:{'core:pathfinding':'expert'}},{name:'human-road-baseline',terrainTile:'sw0_pd0_'},{name:'human-road-worn',terrainTile:'sw0_pd0_',artifacts:{feet:'tum-era:artifact260'}},{name:'ai-sea-hat',ai:true,sea:true,returnSameDay:true,aiArtifacts:{feet:'tum-era:artifact260',head:'core:admiralsHat'}},{name:'ai-sea-baseline',ai:true,sea:true},{name:'ai-sea-worn',ai:true,sea:true,aiArtifacts:{feet:'tum-era:artifact260'}},{name:'ai-sea-navigation',ai:true,sea:true,aiArtifacts:{feet:'tum-era:artifact260'},aiSkills:{'core:navigation':'expert'}},{name:'ai-baseline',ai:true},{name:'ai-worn',ai:true,aiArtifacts:{feet:'tum-era:artifact260'}},{name:'ai-backpack',ai:true,aiArtifacts:{backpack:['tum-era:artifact260']}}];
try{
 for(const c of cases){
  if(process.env.WAYFARER_CASES&&!process.env.WAYFARER_CASES.split(',').includes(c.name))continue;
  await boot(c);if(c.ai){const red=(await state()).heroId;await controlAi();await endToOtherHero(red);}
  if(c.name==='human-other-hero'){await cmd(4,1);await wait(()=>goonkMobileState.heroName==='Adela');}const before=await state(),move=process.env.WAYFARER_SKIP_WALK||c.sea?null:await walkEast();report[c.name]={day:before.day,heroId:before.heroId,name:before.heroName,movement:before.movement,limit:before.heroes.find(h=>h.id===before.heroId).movementLimit,move};
  if(process.env.WAYFARER_SAVE_LOAD)report[c.name].saveLoad=await humanSaveLoad(c);if(c.sea)report[c.name].sea=await seaFollowups(c);if(c.ai&&process.env.WAYFARER_FOLLOWUPS)report[c.name].followups=await aiFollowups();console.log('OBSERVED',c.name,JSON.stringify(report[c.name]));
  if(move&&!process.env.WAYFARER_INSPECT)assert.equal(move.cost,c.terrainTile?150:(c.second||c.ai||!c.artifacts?.feet?350:200),'Human260 usesExpert75;AI260 never changes terrain cost');
  await p.screenshot({path:path.join(out,c.name+'.png')});await p.close();fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
 }
 if(report['ai-baseline']&&report['ai-worn']){assert.equal(report['ai-worn'].movement-report['ai-baseline'].movement,400);assert.equal(report['ai-worn'].limit-report['ai-baseline'].limit,400);}
 for(const name of ['ai-sea-baseline','ai-sea-worn','ai-sea-navigation'])if(report[name]){const sea=report[name].sea,worn=name!=='ai-sea-baseline',baseSea=name==='ai-sea-navigation'?3750:1500;assert.equal(sea.afterBoard.limit,baseSea);assert.equal(sea.nextSeaDay.movement,baseSea+(worn?400:0));assert.equal(sea.nextSeaDay.limit,baseSea+(worn?400:0));assert.equal(sea.afterDisembark.limit,1630);assert.equal(sea.nextLandDay.limit,1630+(worn?400:0));}
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,report},null,2));
}catch(e){report.failure=String(e.stack||e);report.failureState=await state();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:false,report,errors},null,2));if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')});throw e;}finally{fs.writeFileSync(path.join(out,'console.json'),JSON.stringify(consoleLines));await browser.close();}
