import{installReviewedMassHypnotize253Overlay}from'./reviewed-artifact-overlay.mjs';
import {readEraArchive} from '../../scripts/era-bridge/resources.mjs';
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-mass-hypnotize253-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8797';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util,copy
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':'core:christian','primarySkills':{'attack':opts.get('attack',4),'defence':opts.get('defense',7),'spellpower':opts.get('power',10),'knowledge':20},'secondarySkills':opts.get('skills',{'core:wisdom':'expert'}),'spellBook':opts.get('spells',['preset','core:implosion','core:resurrection','core:animateDead','core:armageddon']),'artifacts':dict({'spellbook':'core:spellBook'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':500},{'type':'goonk:bubu','amount':10}])})
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
async function boot(options){console.log('BOOT',JSON.stringify(options));p=await browser.newPage({viewport:JSON.parse(process.env.VIEWPORT||'{"width":844,"height":390}'),hasTouch:true,bypassCSP:true});await silenceTestAudio(p);await installReviewedMassHypnotize253Overlay(p,process.env.HYPNOTIZE_REVIEW||'/tmp/goonk155-mass-hypnotize253-review',{controls:options.controls||{},noCommanders:true});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(consoleLines.length<4000)consoleLines.push((m.type()+': '+m.text()).slice(0,1000));});await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Artifact validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('MAP READY');}
async function sheet(){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);return state();}
async function combat(){await cmd(6);await p.waitForTimeout(150);const t=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),t);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.battleUnits?.length);const initial=await state();await cmd(15);await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.canAct);return{initial,turn:await state()};}
async function spell(id,target){
 await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);
 for(let page=0;page<6&&!(await state()).spellbook.spells.some(s=>s.id===id);++page){const previous=(await state()).spellbook.page;assert((await state()).spellbook.pages>1,'Requested spell absent from known spells: '+id);await cmd(50,1);await wait(n=>goonkMobileState.spellbook.page!==n,previous);}
 const selected=(await state()).spellbook.spells.find(s=>s.id===id);assert(selected?.enabled,'Requested spell is eligible');
 await cmd(49,id);await wait(()=>goonkMobileState.mode==='battle');if(target)await cmd(14,3,target.occupied[0]);
 await p.waitForTimeout(800);return selected.cost;
}
const units=s=>s.battleUnits.filter(u=>u.armySlot>=0);
const sourceSpells=Object.fromEntries(readEraArchive(fs.readFileSync('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod')).extract('sptraits.txt').toString('latin1').split(/\r?\n/).filter(l=>/^(Implosion|Resurrection|Animate Dead|Chain Lightning|Lightning Bolt|Hypnotize)\t/.test(l)).map(l=>{const c=l.split('\t');return[c[0],{coefficient:Number(c[11]),base:Number(c[12]),expert:Number(c[15])}];}));

async function select(id){await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);for(let page=0;page<6&&!(await state()).spellbook.spells.some(s=>s.id===id);page++){const current=(await state()).spellbook.page;assert((await state()).spellbook.pages>1,'Known spell exists');await cmd(50,1);await wait(v=>goonkMobileState.spellbook.page!==v,current);}const entry=(await state()).spellbook.spells.find(s=>s.id===id);assert(entry);await cmd(49,id);await wait(()=>['battle','dialog'].includes(goonkMobileState.mode));return entry;}
async function blocked(id,target,before){await select(id);let s=await state();if(s.mode==='dialog'){report.lastBlocked=s.dialogLines||s.dialogPresentation||s.dialogTitle;await cmd(1);await p.waitForTimeout(200);if((await state()).mode==='spellbook')await cmd(0);await wait(()=>goonkMobileState.mode==='battle');}
 else{await wait(()=>goonkMobileState.spellTargeting);s=await state();assert.equal(s.battleCells.find(c=>c.hex===target.occupied[0]).spellTarget,false,'Native targeting rejects protected target');await cmd(14,3,target.occupied[0]);await p.waitForTimeout(300);}
 s=await state();assert.equal(s.heroMana,before.heroMana,'Blocked native spell spends no mana');return s;}
const hp=u=>u.count*u.maximumHealth-u.maximumHealth+u.currentHealth;
const cases=[
 {name:'baseline',equipped:false},
 {name:'backpack',backpack:true},
 {name:'threshold-basic-exact',allowed:true},
 {name:'threshold-basic-over',over:1},
 {name:'hp-imul32-positive',count:32767,sourceHealth:65536},
 {name:'hp-imul32-negative',count:32768,sourceHealth:65536,allowed:true},
 {name:'hp-imul32-zero',count:65536,sourceHealth:65536,allowed:true},
 {name:'earlier-opening-wound',over:1,wounded:true},
 {name:'multiple-eligible-stacks',allowed:true,multiple:true},
 {name:'two-equipped-rings',allowed:true,duplicate:true},
 {name:'threshold-expert-exact',expert:true,allowed:true},
 {name:'threshold-expert-over',expert:true,over:1},
 {name:'power-one',power:1,allowed:true},
 {name:'power-twenty',power:20,allowed:true},
 {name:'native-resistance100',resistance:true},
 {name:'native-spell-immunity',immunity:true},
 {name:'opponent-recanter-context',recanter:true},
 {name:'duration50',duration:true,allowed:true},
 {name:'defender-ring',reverse:true},
 {name:'defender-ring-backpack',reverse:true,enemyBag:true},
 {name:'earlier-magic-mirror',reverse:true,mirror:true},
 {name:'magic-mirror-with-orb',reverse:true,mirror:true,orb:true},
];
try{
 for(const c of cases){
  if(process.env.HYPNOTIZE_CASES&&!process.env.HYPNOTIZE_CASES.split(',').includes(c.name))continue;
  const power=c.power??13,trait=sourceSpells.Hypnotize,threshold=power*trait.coefficient+(c.expert?trait.expert:trait.base),health=c.sourceHealth??threshold+(c.over??0);
  assert(Number.isInteger(health)&&health>0);const calm={morale:{type:'NO_MORALE'},luck:{type:'NO_LUCK'}};
  const controls={'core:blackDragon':{hitPoints:1000000,speed:25,damage:{min:1,max:1},abilities:{...calm,frozen:{type:'NOT_ACTIVE'}}},'core:archangel':{hitPoints:1000000,speed:30,damage:{min:1,max:1},abilities:calm},'core:peasant':{speed:25,abilities:calm},'core:pikeman':{hitPoints:health,speed:1,damage:{min:1,max:1},abilities:{...calm,...(c.resistance?{resist:{type:'MAGIC_RESISTANCE',val:100}}:{}),...(c.immunity?{immune:{type:'SPELL_IMMUNITY',subtype:'core:hypnotize'}}:{})}}};
  const equipped=c.equipped!==false&&!c.backpack&&!c.reverse;
  await boot({artifacts:equipped?{leftRing:'tum-era:artifact253',...(c.duplicate?{rightRing:'tum-era:artifact253'}:{}),...(c.wounded?{leftHand:'tum-era:artifact210'}:{})}:c.backpack?{backpack:['tum-era:artifact253']}:c.mirror?{misc2:'tum-era:artifact244',...(c.orb?{misc1:'core:orbOfVulnerability'}:{})}:{},power,army:[{type:'core:peasant',amount:1},{type:'core:archangel',amount:1}],enemyHero:true,enemyArmy:[{type:'core:pikeman',amount:c.count??1},...(c.multiple?[{type:'core:pikeman',amount:1}]:[]),{type:'core:blackDragon',amount:1}],enemyArtifacts:c.recanter?{shoulders:'core:recantersCloak'}:c.reverse?(c.enemyBag?{backpack:['tum-era:artifact253']}:{leftRing:'tum-era:artifact253'}):{},spells:['preset'],skills:{'core:wisdom':'expert',...(c.expert?{'core:airMagic':'expert'}:{})},battle:true,controls});
  const before=await sheet();assert.equal(before.heroWindow.primarySkills[2],power);await p.locator('[data-hero-close]').tap();const {turn}=await combat();
  assert(!turn.battleUnits.some(u=>u.armySlot===-2));assert.equal(turn.heroMana,200,'Opening Hypnotize uses no mana');
  const targets=turn.battleUnits.filter(u=>u.key==='core:pikeman');assert.equal(targets.length,c.multiple?2:1);if(c.wounded)assert(targets[0].currentHealth<targets[0].maximumHealth,'Earlier source opening actually wounded the target before253');
  // battleUnits.enemy is explicitly the ORIGINAL army owner. Prove mind
  // control through a real player-action turn for the hostile source stack.
  const own=turn.battleUnits.find(u=>u.key==='core:peasant');assert(own);
  const controlledByRound={},states=[];const stopRound=c.duration?52:2;
  while((await state()).round<stopRound){
   const prior=await state();controlledByRound[prior.round]??=[];controlledByRound[prior.round].push(prior.activeStack);if(states.length<4)states.push(prior);
   await cmd(13,prior.activeStack,prior.round);await wait(v=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&(goonkMobileState.activeStack!==v.stack||goonkMobileState.round!==v.round),{stack:prior.activeStack,round:prior.round});
  }
  report[c.name]={power,threshold,health,first:turn,controlledByRound,states};
  for(const target of targets)assert.equal(controlledByRound[1].includes(target.stackId),!!c.allowed,'Hostile stack receives a real player-action turn exactly when253 controls it');
  assert.equal(controlledByRound[1].includes(own.stackId),!(c.reverse&&!c.enemyBag&&!c.mirror),'Friendly original owner, reverse-side ring and MagicMirror guards');
  report[c.name]={power,threshold,health,first:turn,controlledByRound,states};
  if(c.duration){for(let round=1;round<=50;round++)assert(controlledByRound[round].includes(targets[0].stackId),'Explicit duration50 retains control through round'+round);assert(!controlledByRound[51].includes(targets[0].stackId),'Control expires on round51 independently of threshold power');}
  const expires=c.duration?await state():undefined;
  report[c.name]={power,threshold,health,first:turn,controlledByRound,states,expires};await p.screenshot({path:path.join(out,c.name+'.png')});await p.close();console.log('PASS native mass-Hypnotize253 '+c.name);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
 }
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,report},null,2));
}catch(e){report.failure=String(e.stack||e);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:false,report,errors},null,2));if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')});throw e;}finally{fs.writeFileSync(path.join(out,'console.json'),JSON.stringify(consoleLines));await browser.close();}
