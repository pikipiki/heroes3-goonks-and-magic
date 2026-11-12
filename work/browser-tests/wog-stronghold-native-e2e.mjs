import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {silenceTestAudio} from './silent-audio.mjs';

const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8797';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-stronghold-native';
const review=process.env.GOONK_STRONGHOLD_REVIEW||'/tmp/goonk-stronghold-source-review-147b';
fs.mkdirSync(out,{recursive:true});
const records=JSON.parse(fs.readFileSync(review+'/native-closed-import-review.json')).records.filter(r=>[275,283].includes(r.eraId));
assert(records.every(r=>r.obligations.length===0));
const candidates=JSON.parse(fs.readFileSync(review+'/content/config/native-closed-creatures.candidate.json'));
const definitions=Object.fromEntries([275,283].map(id=>['eraCreature'+id,candidates['eraCreature'+id]]));
const files=records.flatMap(r=>r.assets.map(a=>({path:a.path,bytes:[...fs.readFileSync(review+'/'+a.path)]})));
const engineBuild=await fetch(origin+'/engine-build.json').then(r=>r.json());
const browser=await chromium.launch({headless:true});let p,logs=0;
const report={},errors=[];
const state=()=>p.evaluate(()=>goonkMobileState);
const cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
const wait=(fn,arg,timeout=60000)=>p.waitForFunction(fn,arg,{timeout});
const hp=u=>u?(u.count-1)*u.maximumHealth+u.currentHealth:0;
function fixture(options){return execFileSync('python3',['-c',String.raw`
import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');e={n:z.read(n)for n in z.namelist()};objects=json.loads(e['objects.json']);objects=[o for o in objects if o['instanceName']in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':'core:edric','experience':0,'primarySkills':{'attack':0,'defence':0,'spellpower':1,'knowledge':20},'secondarySkills':{'core:wisdom':'expert'},'spellBook':['core:slow','core:fireball','core:deathRipple'],'artifacts':{'spellbook':'core:spellBook'},'army':opts.get('army',[{'type':'core:blackDragon','amount':100},{'type':'goonk:bubu','amount':2}])})
if opts.get('hillfort'):objects.append({'type':'core:hillFort','subtype':'core:object','instanceName':'sourceHillFort','x':10,'y':11,'l':0,'template':{'animation':'AVXhilg0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}})
if opts.get('hate'):
 objects.append({'type':'core:monster','subtype':'core:peasant','instanceName':'trainingDummy','x':10,'y':11,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':1,'character':'savage','neverFlees':True}})
 objects.append({'type':'core:monster','subtype':'core:gnoll','instanceName':'hateControl','x':12,'y':11,'l':0,'template':{'animation':'AVWgnll0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':1,'character':'savage','neverFlees':True}})
elif opts.get('enemy'):objects.append({'type':'core:garrisonHorizontal','subtype':'core:normal','instanceName':'sourceImmunityGuard','x':10,'y':11,'l':0,'template':{'animation':'AVCgar10.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'army':opts.get('garrison',[{'type':opts['enemy'],'amount':100}])}})
e['objects.json']=json.dumps(objects).encode();h=json.loads(e['header.json']);h['name']='000 - Stronghold source controls';e['header.json']=json.dumps(h).encode()
for f in ['english.json','french.json']:
 t=json.loads(e[f]);t['mapName']=h['name'];e[f]=json.dumps(t).encode()
s=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(s);s.loader.exec_module(n);e=n.normalize(e);b=io.BytesIO()
with zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED)as w:
 for k,v in e.items():w.writestr(k,v)
sys.stdout.buffer.write(b.getvalue())`,JSON.stringify(options)]);}
async function boot(options={}){
 p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(logs++<2000)fs.appendFileSync(out+'/console.log',m.text().slice(0,1200)+'\n');});
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 await p.addInitScript(({definitions,files,records,controls,fixtureKind,hateTarget})=>{
  let module;Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:m=>{module=m;let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>main=f,get:()=>function(...args){
   const root='/home/web_user/.local/share/vcmi/Mods/tum-era/',read=n=>JSON.parse(m.FS.readFile(root+n,{encoding:'utf8'})),write=(n,v)=>m.FS.writeFile(root+n,JSON.stringify(v));
   for(const f of files){m.FS.mkdirTree((root+f.path).split('/').slice(0,-1).join('/'));m.FS.writeFile(root+f.path,new Uint8Array(f.bytes));}
   const manifest=read('mod.json');manifest.creatures.push('config/stronghold-native-controls.json');
   if(controls)for(const d of Object.values(definitions)){d.speed=10;d.abilities.fixtureNoMorale={type:'NO_MORALE'};}
   if(fixtureKind==='shield')for(const d of Object.values(definitions))d.speed=50;
   if(fixtureKind==='shield')definitions['core:efreetSultan']={hitPoints:1000000,abilities:{fixtureFrozen:{type:'NOT_ACTIVE'},fixtureNoCounter:{type:'NO_RETALIATION'}}};
   if(fixtureKind==='spread'){
    for(const d of Object.values(definitions))d.abilities.fixtureFrozen={type:'NOT_ACTIVE'};
    definitions['core:orc']={hitPoints:1000000,abilities:{fixtureFrozen:{type:'NOT_ACTIVE'},fixtureNoCounter:{type:'NO_RETALIATION'},fixtureNoMorale:{type:'NO_MORALE'}}};
    for(const key of ['core:magog','core:powerLich'])definitions[key]={abilities:{fixtureNoMorale:{type:'NO_MORALE'}}};
   }
   if(fixtureKind==='hate'){
    for(const d of Object.values(definitions)){d.speed=50;d.attack=0;d.damage={min:10,max:10};d.stackExperience=d.stackExperience.filter(r=>r.bonus.type==='HATE');d.abilities.fixtureNoCounter={type:'BLOCKS_RETALIATION'};}
    for(const [key,hp]of [['core:peasant',50],['core:gnoll',1000000]])definitions[key]={hitPoints:hp,attack:0,defense:0,abilities:{fixtureFrozen:{type:'NOT_ACTIVE'},fixtureNoCounter:{type:'NO_RETALIATION'},fixtureNoMorale:{type:'NO_MORALE'}}};
   }
   write('content/config/stronghold-native-controls.json',definitions);
   const xp=read('content/config/era-bridge-experience.json');for(const r of records)xp.creatures[r.nativeId]=fixtureKind==='hate'?{...r.experienceProfile,fullRank10:1,rank11Extra:1}:r.experienceProfile;write('content/config/era-bridge-experience.json',xp);
   for(const file of m.FS.readdir(root+'content/config').filter(f=>/^era-bridge-.*\.json$/.test(f))){const doc=read('content/config/'+file);if(doc.sourceIds){for(const r of records)doc.sourceIds[r.nativeId]=r.eraId;write('content/config/'+file,doc);}}
   if(fixtureKind==='hate'&&hateTarget){const status=read('content/config/era-bridge-status-attacks.json');status.sourceIds['core:gnoll']=hateTarget;write('content/config/era-bridge-status-attacks.json',status);}
   write('mod.json',manifest);return main.apply(m,args);
  }});}});
 },{definitions:structuredClone(definitions),files,records,controls:!!options.enemy,fixtureKind:options.fixtureKind,hateTarget:options.hateTarget});
 await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Stronghold source controls');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
}
async function combat(){await cmd(6);await p.waitForTimeout(180);const point=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),point);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canAct&&goonkMobileState.canUseMagic);return state();}
async function cast(id,target){await cmd(14,0);await wait(()=>goonkMobileState.mode==='spellbook');const mana=(await state()).heroMana;await cmd(49,id);await wait(m=>goonkMobileState.mode==='battle'&&(goonkMobileState.spellTargeting||goonkMobileState.heroMana<m),mana);if((await state()).spellTargeting)await cmd(14,3,target);await wait(m=>goonkMobileState.mode==='battle'&&goonkMobileState.heroMana<m&&!goonkMobileState.spellTargeting&&goonkMobileState.canAct,mana);await p.waitForTimeout(350);return state();}
try{
 if(!process.env.CASES||process.env.CASES.includes('stats')){
  await boot({army:[{type:'tum-era:eraCreature275',amount:2},{type:'tum-era:eraCreature283',amount:2},{type:'goonk:bubu',amount:2}]});
  await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.troopEquipment);
  const s=await state();for(const id of [275,283]){const u=s.troopEquipment.troops.find(u=>u.key==='tum-era:eraCreature'+id),d=definitions['eraCreature'+id];assert.equal(u.health,d.hitPoints);assert.equal(u.attack,d.attack);assert.equal(u.defense,d.defense);assert(u.nativeFlags.living&&u.nativeFlags.flying&&!u.nativeFlags.mindImmune&&!u.nativeFlags.noMorale);}
  report.stats=s.troopEquipment.troops;await p.screenshot({path:out+'/portrait-stats.png'});await p.close();p=null;console.log('PASS original Coatl/Quetzalcoatl stats and independent nature');
 }
 if(!process.env.CASES||process.env.CASES.includes('spells'))for(const id of [275,283])for(const [spell,name]of [[54,'slow'],[21,'fireball'],[24,'deathRipple']]){
  await boot({enemy:'tum-era:eraCreature'+id});const before=await combat(),target=before.battleUnits.find(u=>u.enemy),after=await cast(spell,target.occupied[0]),live=after.battleUnits.find(u=>u.stackId===target.stackId);
  assert(live);const damage=hp(target)-hp(live);
  if(name==='slow')assert.equal(live.speed,id===283?target.speed:Math.floor(target.speed*.75),'Only283 cleanses heroSlow after action');
  else if(name==='fireball')assert(damage>0,'Ordinary heroFireball is not canceled');
  else assert.equal(damage,id===283?0:15,'Source DeathRipple origin is canceled regardless of hero caster');
  report[id+'-'+name]={before:target,after:live,damage,manaBefore:before.heroMana,manaAfter:after.heroMana};fs.writeFileSync(out+'/partial-result.json',JSON.stringify({engineBuild,report,errors},null,2));await p.close();p=null;console.log('PASS',id,name);
 }
 if(!process.env.CASES||process.env.CASES.includes('shield'))for(const id of [275,283]){
  await boot({fixtureKind:'shield',army:[{type:'tum-era:eraCreature'+id,amount:2},{type:'goonk:bubu',amount:2}],enemy:'core:efreetSultan'});
  const before=await combat(),own=before.battleUnits.find(u=>u.key==='tum-era:eraCreature'+id),enemy=before.battleUnits.find(u=>u.enemy);assert.equal(before.activeUnit.key,own.key);
  await cmd(14,4,enemy.occupied[0]);await wait(({id,health})=>goonkMobileState.battleUnits.some(u=>u.stackId===id&&(u.count-1)*u.maximumHealth+u.currentHealth<health)&&goonkMobileState.canAct,{id:enemy.stackId,health:hp(enemy)});
  const after=await state(),live=after.battleUnits.find(u=>u.stackId===own.stackId),damage=hp(own)-hp(live);if(id===283)assert.equal(damage,0);else assert(damage>0,'Control takes reflected FireShield damage without retaliation');
  report[id+'-fireShield']={before:own,after:live,damage};await p.screenshot({path:out+'/'+id+'-fireShield.png'});await p.close();p=null;console.log('PASS',id,'sourceFireShield');
 }
 if(!process.env.CASES||process.env.CASES.includes('spread'))for(const caster of ['core:magog','core:powerLich'])for(const [id,primary]of [[275,false],[283,false],[283,true]]){
  const garrison=Array.from({length:7},(_,i)=>({type:i===(primary?3:2)?'tum-era:eraCreature'+id:'core:orc',amount:100}));
  await boot({fixtureKind:'spread',army:[{type:caster,amount:100}],enemy:'core:orc',garrison});let before=await combat();for(let i=0;i<8&&before.activeUnit?.key!==caster;i++){await cmd(13,before.activeStack,before.round);await wait(()=>goonkMobileState.canAct);before=await state();}assert.equal(before.activeUnit?.key,caster);
  const own=before.battleUnits.find(u=>u.key===caster),immune=before.battleUnits.find(u=>u.key==='tum-era:eraCreature'+id),enemies=before.battleUnits.filter(u=>u.enemy),point=before.battleUnits.find(u=>u.stackId===immune.stackId);
  const row=u=>Math.floor(u.occupied[0]/17),target=primary?point:enemies.filter(u=>u.key==='core:orc').sort((a,b)=>Math.abs(row(a)-row(immune))-Math.abs(row(b)-row(immune)))[0];
  await cmd(14,4,target.occupied[0]);await wait(({id,health})=>goonkMobileState.battleUnits.some(u=>u.stackId===id&&(u.count-1)*u.maximumHealth+u.currentHealth<health)&&goonkMobileState.canAct,{id:target.stackId,health:hp(target)});
  const after=await state(),live=after.battleUnits.find(u=>u.stackId===immune.stackId),damage=hp(immune)-hp(live);if(id===283&&!primary)assert.equal(damage,0);else assert(damage>0,'Source immunity leaves primary hits and unupgraded control vulnerable');
  report[caster+'-'+id+'-'+primary]={before:immune,primary,target,after:live,damage};await p.close();p=null;console.log('PASS',caster,id,'primary',primary);
 }
 if(!process.env.CASES||process.env.CASES.includes('hate'))for(const id of [275,283])for(const sourceTarget of [4,274,282]){
  await boot({fixtureKind:'hate',hate:true,hateTarget:sourceTarget===4?0:sourceTarget,enemy:'core:gnoll',army:[{type:'tum-era:eraCreature'+id,amount:1}]});await combat();
  for(let i=0;i<240;i++){const s=await state();if(s.mode==='map'&&!s.hasPath){await p.waitForTimeout(500);if((await state()).mode==='map')break;}else if(s.mode==='battle'&&s.canAutoCombat&&!s.autoCombat)await cmd(44,1);else if(s.mode==='dialog')await cmd(1);await p.waitForTimeout(150);}
  await wait(()=>goonkMobileState.mode==='map'&&!goonkMobileState.hasPath);await p.waitForTimeout(500);await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.troopEquipment);
  const trained=(await state()).armies[0].slots.find(u=>u?.key==='tum-era:eraCreature'+id);assert.equal(trained.experienceRank,10,'Real combat must earnR10');await p.locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');
  await combat();let before=await state();assert.equal(before.activeUnit?.key,'tum-era:eraCreature'+id);const target=before.battleUnits.find(u=>u.enemy);await cmd(14,4,target.occupied[0]);await wait(({id,h})=>goonkMobileState.battleUnits.some(u=>u.stackId===id&&(u.count-1)*u.maximumHealth+u.currentHealth<h)&&goonkMobileState.canAct,{id:target.stackId,h:hp(target)});
  const after=await state(),live=after.battleUnits.find(u=>u.stackId===target.stackId),damage=hp(target)-hp(live);assert.equal(damage,sourceTarget===4?10:30,'Native HATE adds exact200percent only to registered source targets');
  report[id+'-hate-'+sourceTarget]={trained,before:target,after:live,damage,syntheticTargetIdentity:true,scope:'Owned deterministic physical control, no target placeholder is installed in production.'};await p.close();p=null;console.log('PASS',id,'R10HATE source target',sourceTarget,'damage',damage);
 }
 if(!process.env.CASES||process.env.CASES.includes('upgrade')){
  await boot({hillfort:true,army:[{type:'tum-era:eraCreature275',amount:2},{type:'goonk:bubu',amount:2}]});await cmd(29,0);await cmd(6);await p.waitForTimeout(180);const point=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),point);await wait(()=>goonkMobileState.hasPath);await cmd(2);await p.waitForTimeout(1400);
  const before=await state();const dimensions=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',"import fs from'node:fs';import{readEraArchive}from'./scripts/era-bridge/resources.mjs';const p=readEraArchive(fs.readFileSync('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod')).extract('APHLFTBK.pcx');console.log(JSON.stringify({w:p.readUInt32LE(4),h:p.readUInt32LE(8)}));"],{encoding:'utf8'}));
  await p.evaluate(({w,h})=>Module._vcmiMobilePointer((800-w)/2+130,(600-h)/2+185,1),dimensions);await wait(()=>goonkMobileState.armies?.[0]?.slots?.[0]?.key==='tum-era:eraCreature283');const after=await state();assert.equal(after.armies[0].slots[0].count,2);assert.equal(after.armies[0].slots[1].key,'goonk:bubu');assert.equal(after.armies[0].slots[1].count,2);
  const cost=Object.fromEntries(Object.keys(definitions.eraCreature283.cost).map(k=>[k,2*(definitions.eraCreature283.cost[k]-(definitions.eraCreature275.cost[k]||0))]));for(const [index,key]of ['wood','mercury','ore','sulfur','crystal','gems','gold'].entries())assert.equal(before.resources[index]-after.resources[index],cost[key]);
  report.upgrade={cost,before:before.resources,after:after.resources,army:after.armies[0]};await p.screenshot({path:out+'/portrait-upgrade.png'});await p.close();p=null;console.log('PASS source paid275→283 upgrade, resources, counts and Goonks');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,engineBuild,report,errors,scope:'Original stats and hero-spell source-event controls; synthetic speed10/NO_MORALE fixture isolates cast timing. Additional physical-origin and deferredHATE controls remain required before promotion.'},null,2));
}catch(error){console.error(error);if(p){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:out+'/failure.png'}).catch(()=>{});}throw error;}finally{await browser.close();}
