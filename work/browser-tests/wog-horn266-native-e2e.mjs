import{installHorn266Overlay}from'./horn266-overlay.mjs';
import {readEraArchive} from '../../scripts/era-bridge/resources.mjs';
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'work/downloads/horn266-native159';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8813';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util,copy
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':opts.get('hero','core:christian'),'primarySkills':{'attack':opts.get('attack',4),'defence':opts.get('defense',7),'spellpower':opts.get('power',10),'knowledge':20},'secondarySkills':opts.get('skills',{'core:wisdom':'expert'}),'spellBook':opts.get('spells',['preset','core:implosion','core:resurrection','core:animateDead','core:armageddon']),'artifacts':dict({'spellbook':'core:spellBook','misc5':'core:shacklesOfWar'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':500},{'type':'goonk:bubu','amount':10}])})
if opts.get('guild'):
 town=next(o for o in objects if o['instanceName']=='goonkTown')
 for i,x in enumerate([5,10,15]):
  extra=copy.deepcopy(town);extra.update({'instanceName':'extraTavern'+str(i),'x':x,'y':25});objects.append(extra)
if opts.get('enemyHero'):
 hero=next(o for o in objects if o['instanceName']=='goonkHero')
 objects.append({'type':'core:hero','subtype':'core:knight','instanceName':'enemyHero','x':11,'y':11,'l':0,'template':hero['template'],'options':{'owner':'blue','type':'core:orrin','primarySkills':{'attack':10,'defence':20,'spellpower':3,'knowledge':5},'artifacts':opts.get('enemyArtifacts',{'shoulders':'tum-era:artifact261'} if opts.get('enemyCloak') else {}),'army':opts.get('enemyArmy',opts['army'])}})
elif opts.get('battle'):
 objects.append({'type':'core:monster','subtype':opts.get('enemy','core:ancientBehemoth'),'instanceName':'artifactGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWbhmX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts.get('enemyCount',100),'character':opts.get('character','savage'),'neverFlees':opts.get('neverFlees',True)}})

if opts.get('terrain'):
 terrain=json.loads(entries['surface_terrain.json']);entries['surface_terrain.json']=json.dumps([[opts['terrain']+'0_' for tile in row] for row in terrain]).encode()
entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['allowedArtifacts']={'anyOf':['core:speculum']};h['name']='000 - Artifact validation';entries['header.json']=json.dumps(h).encode()
for n in ['english.json','french.json']:
 t=json.loads(entries[n]);t['mapName']='000 - Artifact validation';entries[n]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(options)]);
async function boot(options){console.log('BOOT',options.name);p=await browser.newPage({viewport:JSON.parse(process.env.VIEWPORT||'{"width":844,"height":390}'),hasTouch:true,bypassCSP:true});await silenceTestAudio(p);await p.addInitScript(()=>{window.hornFrames=[];addEventListener('goonk-state',e=>{const s=e.detail;if(s?.mode==='battle'&&hornFrames.length<4000)hornFrames.push({round:s.round,activeStack:s.activeStack,controlled:s.activeUnit?.controlled,units:s.battleUnits?.map(u=>({id:u.stackId,key:u.key,count:u.count,hp:u.currentHealth,enemy:u.enemy}))});});});await installHorn266Overlay(p,process.env.HORN_REVIEW||'work/downloads/horn266-source-stage159-v2',{controls:options.controls||{},layout:options.layout,profile:options.profile});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(consoleLines.length<4000)consoleLines.push((m.type()+': '+m.text()).slice(0,1000));});await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Artifact validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('MAP READY');}
async function combat(){await cmd(6);await p.waitForTimeout(150);await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;Module._vcmiMobilePointer(v.x+v.w/2+64,v.y+v.h/2,1);});await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.battleUnits?.length);await cmd(15);await wait(()=>goonkMobileState.canAct&&goonkMobileState.canUseMagic);return state();}
const hp=u=>(u.count-1)*u.maximumHealth+u.currentHealth;
const calm={morale:{type:'NO_MORALE'},luck:{type:'NO_LUCK'}};
const baseControls={'core:blackDragon':{hitPoints:1000000,speed:1,damage:{min:1,max:1},abilities:{...calm,frozen:{type:'NOT_ACTIVE'}}},'core:pikeman':{speed:1,attack:0,defense:0,damage:{min:1,max:1},abilities:{...calm,living:{type:'LIVING'}}}};
async function advance(){const before=await state();await cmd(13,before.activeStack,before.round);await wait(v=>goonkMobileState.mode!=='battle'||goonkMobileState.canAct&&(goonkMobileState.activeStack!==v.id||goonkMobileState.round!==v.round),{id:before.activeStack,round:before.round});}
async function selectSpell(id,target){await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.heroCanCast);await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);for(let i=0;i<8&&!(await state()).spellbook.spells.some(s=>s.id===id);i++){const n=(await state()).spellbook.page;await cmd(50,1);await wait(n=>goonkMobileState.spellbook.page!==n,n);}const entry=(await state()).spellbook.spells.find(s=>s.id===id);assert(entry?.enabled,'Castable fixture spell');await cmd(49,id);await wait(()=>goonkMobileState.mode==='battle');await cmd(14,3,target.occupied[0]);await p.waitForTimeout(500);}
const cases=[
 {name:'K60-nohero-ten',noHero:true,health:10,hypnotized:true},
 {name:'K60-nohero-eleven-wounded',noHero:true,health:11,hypnotized:false},
 {name:'K60-basic-exact',health:35,hypnotized:true},
 {name:'K60-basic-over',health:36,hypnotized:false},
 {name:'K60-advanced-exact',health:45,mastery:'advanced',hypnotized:true},
 {name:'K60-expert-exact',health:75,mastery:'expert',hypnotized:true},
 {name:'K60-sorcery-not-threshold',health:36,sorcery:true,hypnotized:false},
 {name:'K60-immunity',health:35,immune:true,hypnotized:false},
 {name:'Horn-targeted-hero',horn:true},
 {name:'Horn-backpack',horn:true,backpack:true},
 {name:'Horn-targeted-ring',horn:true,ring:true},
 {name:'Horn-undead',horn:true,undead:true},
 {name:'Horn-melee',horn:true,physical:true},
 {name:'Horn-melee-ring',horn:true,physical:true,ring:true},
 {name:'Horn-melee-backpack',horn:true,physical:true,backpack:true},
 ...(process.env.HORN_ASTRAL==='1'?[{name:'K60-Astral-target1-exact37',hero:'core:astral',health:37,hypnotized:true},{name:'K60-Astral-target1-over38',hero:'core:astral',health:38,hypnotized:false},{name:'K60-Astral-target2-no-adjust',hero:'core:astral',health:261,power:10,level2:true,hypnotized:false}]:[]),
];
try{
 for(const c of cases){if(process.env.HORN_CASES&&!process.env.HORN_CASES.split(',').includes(c.name))continue;
  if(c.noHero){
   const controls=structuredClone(baseControls);controls['core:pikeman'].hitPoints=c.health;
   controls['core:blackDragon']={hitPoints:1000000,speed:100,damage:{min:1,max:1},abilities:{...calm,noCounter:{type:'NO_RETALIATION'}}};
   controls['tum-era:eraCreature263']={speed:60,attack:0,damage:{min:1,max:1},abilities:calm};
   await boot({name:c.name,artifacts:{},power:1,army:[{type:'core:pikeman',amount:1},{type:'core:blackDragon',amount:1}],battle:true,enemy:'tum-era:eraCreature263',enemyCount:1,controls,layout:{attacker:[88,123,140,157,174,71,54],defender:[86,103,120,137,154,171,188]}});
   const before=await combat();const occupied=before.battleUnits.flatMap(u=>u.occupied);assert.equal(new Set(occupied).size,occupied.length,'Normal fixture must have no overlapping native units');const target=before.battleUnits.find(u=>u.key==='core:pikeman');assert.equal(before.activeUnit.key,'core:blackDragon');
   await advance();const after=await state();const wounded=after.battleUnits.find(u=>u.stackId===target.stackId);assert(wounded&&hp(wounded)<c.health,'Neutral Fangarm actually attacked the intended target');
   const frames=await p.evaluate(()=>hornFrames),dragon=after.battleUnits.find(u=>u.key==='core:blackDragon'),controlled=dragon.currentHealth<1000000;assert.equal(controlled,c.hypnotized,'Only hypnotized Pikeman attacks its own distant Dragon ally; NO_RETALIATION keeps the control effect intact');assert.equal(after.round>1,c.hypnotized,'Controlled target loses the original player-action turn');
   if(!c.hypnotized)assert.equal(after.activeStack,target.stackId);report[c.name]={before,after,frames};await p.close();fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));console.log('PASS',c.name);continue;
  }
  const controls=structuredClone(baseControls),actor=c.horn?'core:halberdier':'tum-era:eraCreature263';
  controls[actor]={speed:60,attack:0,damage:{min:c.physical?1000:1,max:c.physical?1000:1},abilities:calm};controls['core:pikeman'].hitPoints=c.horn?50:c.health;
  if(c.level2)controls['core:archer']=controls['core:pikeman'];
  if(c.immune)controls['core:pikeman'].abilities.immune={type:'SPELL_IMMUNITY',subtype:'core:hypnotize'};
  if(c.undead){controls['core:skeleton']=controls['core:pikeman'];delete controls['core:skeleton'].abilities.living;}
  const artifacts=c.horn?(c.backpack?{backpack:['tum-era:artifact266']}:{misc1:'tum-era:artifact266'}):{};if(c.ring)artifacts.leftRing='tum-era:artifact268';
  await boot({name:c.name,hero:c.hero,artifacts,power:c.horn?10:c.power??1,skills:{'core:wisdom':'expert',...(c.mastery?{'core:airMagic':c.mastery}:{}),...(c.sorcery?{'core:sorcery':'expert'}:{})},spells:['preset','core:implosion'],army:[{type:actor,amount:1}],enemyHero:true,enemyArmy:[{type:c.undead?'core:skeleton':c.level2?'core:archer':'core:pikeman',amount:c.horn?4:1},{type:'core:blackDragon',amount:1}],enemyArtifacts:{},controls,layout:{attacker:[88,105,122,139,156,173,71],defender:[86,103,120,137,154,171,188]}});
  if(c.horn){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero');fs.writeFileSync(path.join(out,c.name+'-hero.json'),JSON.stringify(await state(),null,2));await p.locator('[data-hero-close]').tap();}
  const before=await combat();const occupied=before.battleUnits.flatMap(u=>u.occupied);assert.equal(new Set(occupied).size,occupied.length,'Normal fixture must have no overlapping native units');const target=before.battleUnits.find(u=>u.key===(c.undead?'core:skeleton':c.level2?'core:archer':'core:pikeman'));assert(target);assert.equal(before.activeUnit.key,actor);
  if(c.horn){if(c.physical)await p.evaluate(t=>{Module._vcmiMobilePointer(t.x,t.y,0);Module._vcmiMobilePointer(t.x,t.y,1);},target);else await selectSpell(18,target);await wait(id=>goonkMobileState.canAct&&!goonkMobileState.battleUnits.some(u=>u.stackId===id&&u.count>0),target.stackId);if(!c.backpack&&!c.undead)await wait(()=>goonkMobileState.battleUnits.some(u=>u.key==='tum-era:eraCreature263'&&!u.enemy),null,15000);else await p.waitForTimeout(1000);const after=await state(),summons=after.battleUnits.filter(u=>u.key==='tum-era:eraCreature263'&&!u.enemy);assert.equal(summons.length,c.backpack||c.undead?0:1);if(summons.length)assert.equal(summons[0].count,2,'min(4*50/50,floor4/2)');assert.equal(after.heroMana,before.heroMana-(c.physical?0:30),'Only hero Implosion spends mana');report[c.name]={before,after,summons};}
  else{const initial=hp(target);await p.evaluate(t=>{Module._vcmiMobilePointer(t.x,t.y,0);Module._vcmiMobilePointer(t.x,t.y,1);},target);await wait(prior=>goonkMobileState.canAct&&(goonkMobileState.activeStack!==prior.id||goonkMobileState.round!==prior.round),{id:before.activeStack,round:before.round});const controlled=[];for(let i=0;i<12&&(await state()).round<=2;i++){const s=await state();controlled.push({round:s.round,id:s.activeStack,controlled:s.activeUnit?.controlled});await advance();}const after=await state();assert.equal(controlled.some(s=>s.id===target.stackId),c.hypnotized,'K60 real player-action control');report[c.name]={initial,before,after,controlled};}
  await p.screenshot({path:path.join(out,c.name+'.png')});await p.close();fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));console.log('PASS',c.name);
 }
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,report},null,2));
}catch(e){fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:false,report,error:String(e.stack||e),state:p&&!p.isClosed()?await state():null,errors},null,2));if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')});throw e;}finally{fs.writeFileSync(path.join(out,'console.json'),JSON.stringify(consoleLines));await browser.close();}
