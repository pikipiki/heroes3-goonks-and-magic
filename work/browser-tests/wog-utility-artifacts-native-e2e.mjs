import {readEraArchive} from '../../scripts/era-bridge/resources.mjs';
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-utility-artifacts-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8794';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':'core:christian','primarySkills':{'attack':opts.get('attack',4),'defence':opts.get('defense',7),'spellpower':opts.get('power',10),'knowledge':20},'secondarySkills':opts.get('skills',{'core:wisdom':'expert'}),'spellBook':['preset','core:implosion','core:resurrection','core:animateDead','core:armageddon','core:fireElemental','core:earthElemental'],'artifacts':dict({'spellbook':'core:spellBook'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':500},{'type':'goonk:bubu','amount':10}])})
if opts.get('enemyHero'):
 hero=next(o for o in objects if o['instanceName']=='goonkHero')
 objects.append({'type':'core:hero','subtype':'core:knight','instanceName':'enemyHero','x':11,'y':11,'l':0,'template':hero['template'],'options':{'owner':'blue','type':'core:orrin','primarySkills':{'attack':10,'defence':20,'spellpower':3,'knowledge':5},'artifacts':{'shoulders':'tum-era:artifact261'} if opts.get('enemyCloak') else {},'army':opts.get('enemyArmy',opts['army'])}})
elif opts.get('battle'):
 objects.append({'type':'core:monster','subtype':opts.get('enemy','core:ancientBehemoth'),'instanceName':'artifactGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWbhmX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts.get('enemyCount',100),'character':'savage','neverFlees':True}})

entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['allowedArtifacts']={'anyOf':['core:speculum']};h['name']='000 - Artifact validation';entries['header.json']=json.dumps(h).encode()
for n in ['english.json','french.json']:
 t=json.loads(entries[n]);t['mapName']='000 - Artifact validation';entries[n]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(options)]);
async function boot(options){console.log('BOOT',JSON.stringify(options));p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(consoleLines.length<4000)consoleLines.push((m.type()+': '+m.text()).slice(0,1000));});await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);const mapBytes=[...fixture(options)];await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),mapBytes);if(options.handicap)await p.evaluate(()=>{Module._vcmiMobileEnable(2);const native=Module._vcmiMobileCommand;Module._vcmiMobileCommand=(action,...args)=>action===24?undefined:native(action,...args);});await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Artifact validation');
 if(options.handicap){await p.evaluate(()=>Module._vcmiMobileEnable(2));await p.waitForTimeout(200);await p.evaluate(()=>Module._vcmiMobilePointer(500,520,1));await p.waitForTimeout(250);await p.evaluate(()=>Module._vcmiMobilePointer(132,166,1));await p.waitForTimeout(250);fs.writeFileSync(path.join(out,'handicap-open.png'),Buffer.from((await p.evaluate(()=>Module.canvas.toDataURL())).split(',')[1],'base64'));await p.evaluate(()=>Module._vcmiMobileEnable(2));await p.waitForTimeout(200);await p.evaluate(()=>Module._vcmiMobilePointer(610,288,1));await p.waitForTimeout(200);await p.evaluate(()=>{Module.canvas.style.setProperty('display','block','important');Module.canvas.style.setProperty('visibility','visible','important');Module.canvas.style.position='absolute';Module.canvas.style.left='-9999px';Module.canvas.tabIndex=0;Module.canvas.focus();});for(let i=0;i<3;++i)await p.keyboard.press('Backspace');await p.keyboard.type(String(options.handicap));await p.waitForTimeout(200);fs.writeFileSync(path.join(out,'handicap-edited.png'),Buffer.from((await p.evaluate(()=>Module.canvas.toDataURL())).split(',')[1],'base64'));await p.evaluate(()=>Module._vcmiMobilePointer(400,355,1));await p.waitForTimeout(400);await p.waitForTimeout(200);fs.writeFileSync(path.join(out,'handicap-committed.png'),Buffer.from((await p.evaluate(()=>Module.canvas.toDataURL())).split(',')[1],'base64'));}
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),mapBytes);await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);if(options.handicap)await p.evaluate(()=>Module._vcmiMobileEnable(1));console.log('MAP READY');}
async function sheet(){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);return state();}
async function combat(){await cmd(6);await p.waitForTimeout(150);const t=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),t);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.battleUnits?.length);return state();}
async function spell(id,target){
 await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);
 for(let page=0;page<6&&!(await state()).spellbook.spells.some(s=>s.id===id);++page){const previous=(await state()).spellbook.page;await cmd(50,1);await wait(n=>goonkMobileState.spellbook.page!==n,previous);}
 const selected=(await state()).spellbook.spells.find(s=>s.id===id);assert(selected?.enabled,'Requested spell is eligible');
 await cmd(49,id);await wait(()=>goonkMobileState.mode==='battle');if(target)await cmd(14,3,target.occupied[0]);
 await p.waitForTimeout(800);return selected.cost;
}
const units=s=>s.battleUnits.filter(u=>u.armySlot>=0);
const sourceSpells=Object.fromEntries(readEraArchive(fs.readFileSync('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod')).extract('sptraits.txt').toString('latin1').split(/\r?\n/).filter(l=>/^(Implosion|Resurrection|Animate Dead)\t/.test(l)).map(l=>{const c=l.split('\t');return[c[0],{coefficient:Number(c[11]),base:Number(c[12])}];}));
try{
 if(!process.env.CASES||process.env.CASES.includes('goose')){
  let baseline;
  for(const mode of ['baseline','equipped','backpack','two','purse','goose-purse']){
   const artifacts=mode==='equipped'?{misc1:'tum-era:artifact179'}:mode==='backpack'?{backpack:['tum-era:artifact179']}:mode==='two'?{misc1:'tum-era:artifact179',backpack:['tum-era:artifact179']}:mode==='purse'?{misc5:'core:endlessPurseOfGold'}:mode==='goose-purse'?{misc1:'tum-era:artifact179',misc5:'core:endlessPurseOfGold'}:{};
   await boot({artifacts});const before=await state();await cmd(3);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day===2);const after=await state(),income=after.resources[6]-before.resources[6];
   if(mode==='baseline')baseline=income;else assert.equal(income-baseline,mode==='equipped'||mode==='two'?7000:mode==='purse'?500:mode==='goose-purse'?7500:0,'Source raw daily income and equipped copy/backpack eligibility');
   report['goose-'+mode]={income,before:before.resources,after:after.resources};await p.close();console.log('PASS Goose '+mode);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
  }
 }
 if(process.env.CASES?.includes('handicap')){
  let normal,baseline;for(const mode of ['normal','half','goose']){await boot({artifacts:mode==='goose'?{misc1:'tum-era:artifact179'}:{},...(mode==='normal'?{}:{handicap:50})});const before=await state();await cmd(3);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day===2);const after=await state(),income=after.resources[6]-before.resources[6];if(mode==='normal')normal=income;else if(mode==='half'){baseline=income;assert.equal(income,Math.ceil(normal*.5),'Native UI50percent income handicap is actually active');}else assert.equal(income-baseline,7000,'Goose pays raw7000 after income handicap');report['goose-handicap-'+mode]={income,before:before.resources,after:after.resources};await p.close();console.log('PASS Goose income handicap '+mode);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));}
 }
 if(!process.env.CASES||process.env.CASES.includes('reflection')){
  for(const aura of [false,true]){
   let baseline,components;
   for(const mode of ['baseline','components','equipped','backpack']){
    const artifacts=mode==='equipped'?{neck:'tum-era:artifact181'}:mode==='backpack'?{backpack:['tum-era:artifact181']}:mode==='components'?{neck:'core:garnitureOfInterference',shoulders:'core:surcoatOfCounterpoise',feet:'core:bootsOfPolarity'}:{};
    const army=aura?[{type:'core:blackDragon',amount:100},{type:'core:redDragon',amount:10},{type:'core:greenDragon',amount:10},{type:'core:battleDwarf',amount:100},{type:'core:unicorn',amount:10},{type:'goonk:bubu',amount:10},{type:'core:azureDragon',amount:10}]:[{type:'core:battleDwarf',amount:100},{type:'core:blackDragon',amount:500}];
    await boot({artifacts,army,battle:true});const s=await combat(),dwarf=s.battleUnits.find(u=>!u.enemy&&u.key==='core:battleDwarf');assert(dwarf&&Number.isInteger(dwarf.magicResistance),'Native resistance exported');
    if(mode==='baseline'){baseline=dwarf.magicResistance;assert.equal(baseline,aura?52:40,'Real adjacent20percent aura combines after native40percent resistance');}else if(mode==='components'){components=dwarf.magicResistance;assert(components>baseline,'Original components retain native resistance');}else assert.equal(dwarf.magicResistance,mode==='equipped'?Math.min(100,components+20):baseline,'Source post-aura resistance addition');
    report['reflection-'+aura+'-'+mode]=s.battleUnits;await p.close();console.log('PASS Reflection '+aura+' '+mode);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
   }
  }
 }
 if(!process.env.CASES||process.env.CASES.includes('ring')){
  for(const equipped of [true,false]){
   await boot({artifacts:equipped?{rightRing:'tum-era:artifact197'}:{backpack:['tum-era:artifact197']},army:[{type:'core:blackDragon',amount:500}],battle:true,enemy:'core:dendroidGuard',enemyCount:10000});
   await combat();await spell(66);for(let i=0;i<200;++i){const s=await state();if(s.round>1&&s.heroCanCast)break;if(s.activeUnit?.controlled)await cmd(13,s.activeStack,s.round);await p.waitForTimeout(120);}
   await wait(()=>goonkMobileState.round>1&&goonkMobileState.heroCanCast);assert((await state()).battleUnits.some(u=>!u.enemy&&u.key==='core:fireElemental'),'First elemental family survives before testing exclusivity');await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);
   for(let i=0;i<6&&!(await state()).spellbook.spells.some(s=>s.id===67);i++){const page=(await state()).spellbook.page;await cmd(50,1);await wait(n=>goonkMobileState.spellbook.page!==n,page);}
   const earth=(await state()).spellbook.spells.find(s=>s.id===67);assert(earth);const mana=(await state()).spellbook.mana;await cmd(49,67);
   if(equipped){await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.battleUnits?.some(u=>!u.enemy&&u.key==='core:earthElemental'));const s=await state();assert(s.battleUnits.some(u=>!u.enemy&&u.key==='core:fireElemental'));assert.equal(mana-s.heroMana,earth.cost);report['ring-'+equipped]={units:s.battleUnits,mana:s.heroMana};}
   else{await wait(()=>goonkMobileState.mode==='dialog');const blocked=await state();report['ring-blocked-dialog']=blocked;await cmd(1);await p.waitForTimeout(300);if((await state()).mode==='spellbook')await cmd(0);await wait(()=>goonkMobileState.mode==='battle');const s=await state();assert(s.battleUnits.some(u=>!u.enemy&&u.key==='core:fireElemental'));assert(!s.battleUnits.some(u=>!u.enemy&&u.key==='core:earthElemental'));assert.equal(s.heroMana,mana,'Rejected second family spends no mana');report['ring-'+equipped]={units:s.battleUnits,mana:s.heroMana};}
   await p.close();console.log('PASS actual native Ring '+equipped);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,report},null,2));
}catch(e){fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(out,'console.log'),consoleLines.join('\n'));}
