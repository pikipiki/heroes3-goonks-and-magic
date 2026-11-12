import {readEraArchive} from '../../scripts/era-bridge/resources.mjs';
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-battle-artifacts-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8794';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':'core:christian','primarySkills':{'attack':opts.get('attack',4),'defence':opts.get('defense',7),'spellpower':opts.get('power',10),'knowledge':20},'secondarySkills':opts.get('skills',{'core:wisdom':'expert'}),'spellBook':opts.get('spells',['preset','core:implosion','core:resurrection','core:animateDead','core:armageddon']),'artifacts':dict({'spellbook':'core:spellBook'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':500},{'type':'goonk:bubu','amount':10}])})
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
async function boot(options){console.log('BOOT',JSON.stringify(options));p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(consoleLines.length<4000)consoleLines.push((m.type()+': '+m.text()).slice(0,1000));});await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Artifact validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('MAP READY');}
async function sheet(){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);return state();}
async function combat(){await cmd(6);await p.waitForTimeout(150);const t=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),t);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.battleUnits?.length);return state();}
async function spell(id,target){
 await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);
 for(let page=0;page<6&&!(await state()).spellbook.spells.some(s=>s.id===id);++page){const previous=(await state()).spellbook.page;assert((await state()).spellbook.pages>1,'Requested spell absent from known spells: '+id);await cmd(50,1);await wait(n=>goonkMobileState.spellbook.page!==n,previous);}
 const selected=(await state()).spellbook.spells.find(s=>s.id===id);assert(selected?.enabled,'Requested spell is eligible');
 await cmd(49,id);await wait(()=>goonkMobileState.mode==='battle');if(target)await cmd(14,3,target.occupied[0]);
 await p.waitForTimeout(800);return selected.cost;
}
const units=s=>s.battleUnits.filter(u=>u.armySlot>=0);
const sourceSpells=Object.fromEntries(readEraArchive(fs.readFileSync('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod')).extract('sptraits.txt').toString('latin1').split(/\r?\n/).filter(l=>/^(Implosion|Resurrection|Animate Dead)\t/.test(l)).map(l=>{const c=l.split('\t');return[c[0],{coefficient:Number(c[11]),base:Number(c[12])}];}));
try{
 const army=[{type:'core:swordsman',amount:100},{type:'goonk:bubu',amount:100},{type:'core:blackDragon',amount:500},{type:'core:ballista',amount:1}];
 if(!process.env.CASES||process.env.CASES.includes('cloak')){
  await boot({artifacts:{},army,enemyHero:true,battle:true});const baseline=units(await combat());await p.close();
  for(const mode of ['attacker','defender','both','backpack']){
   await boot({army,enemyHero:true,battle:true,artifacts:mode==='attacker'||mode==='both'?{shoulders:'tum-era:artifact261'}:mode==='backpack'?{backpack:['tum-era:artifact261']}:{},enemyCloak:mode==='defender'||mode==='both'});
   const before=await sheet();await p.locator('[data-hero-close]').tap();const s=await combat();console.log('COMBAT READY',mode);
   for(const u of units(s)){
    const exchanged=mode==='attacker'||mode==='defender';const ref=baseline.find(b=>b.key===u.key&&b.enemy===(exchanged&&u.key!=='core:ballista'?!u.enemy:u.enemy));assert(ref,u.key);
    assert.equal(u.attack,ref.attack,mode+' exchanged native ATK '+u.key);assert.equal(u.defense,ref.defense,mode+' exchanged native DEF '+u.key);
   }
   if(mode==='attacker'||mode==='defender')assert(s.heroMana<before.heroMana,'Current mana transferred from the weaker enemy hero');
   else assert(s.heroMana>=before.heroMana,'Both cloaks/backpack leave current mana intact');
   report['cloak-'+mode]={beforeMana:before.heroMana,afterMana:s.heroMana,units:units(s)};await p.close();console.log('PASS cloak '+mode);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
  }
 }
 if(process.env.CASES?.includes('persistent')){
  await boot({spells:['preset'],artifacts:{shoulders:'tum-era:artifact261'},army:[{type:'core:blackDragon',amount:500}],enemyHero:true,enemyArmy:[{type:'core:pikeman',amount:1}],battle:true});
  const before=await sheet();await p.locator('[data-hero-close]').tap();const battle=await combat(),exchangedMana=battle.heroMana;assert(exchangedMana<before.heroMana);
  let settled=0;for(let i=0;i<1000;i++){const v=await state();if(v.mode==='battle'){if(v.canAutoCombat&&!v.autoCombat)await cmd(44,1);}else if(v.mode==='dialog'){settled=0;if(v.dialogKind==='commander-level-up'){const choice=v.dialogPresentation?.choices?.find(c=>c.selectable);if(choice)await cmd(96,choice.skillId);}await cmd(1);}else if(v.mode==='map'&&!v.hasPath&&++settled>=8)break;await p.waitForTimeout(120);}
  const after=await sheet();assert.equal(after.heroMana,exchangedMana,'Exchanged current mana persists after battle');assert.deepEqual(after.heroWindow.primarySkills,before.heroWindow.primarySkills,'Exchanged army bonuses never overwrite map hero primary skills');report.cloakPersistent={beforeMana:before.heroMana,exchangedMana,afterMana:after.heroMana,skills:after.heroWindow.primarySkills};await p.close();console.log('PASS cloak persistent mana and original world primary skills');
 }
 if(!process.env.CASES||process.env.CASES.includes('implosion'))for(const equipped of [true,false]){
  await boot({artifacts:equipped?{rightRing:'tum-era:artifact263'}:{backpack:['tum-era:artifact263']},army:[{type:'core:blackDragon',amount:500},{type:'goonk:bubu',amount:100}],enemyHero:true,enemyArmy:[{type:'core:pikeman',amount:1000},{type:'core:halberdier',amount:1000},{type:'core:swordsman',amount:1000}],battle:true,power:10});
  const hero=await sheet(),power=hero.heroWindow.primarySkills[2];await p.locator('[data-hero-close]').tap();const before=await combat(),enemy=before.battleUnits.filter(u=>u.enemy&&u.armySlot>=0),primary=enemy[0];assert(enemy.length>1);
  const cost=await spell(18,primary);await wait(mana=>goonkMobileState.mode==='battle'&&goonkMobileState.heroMana<mana,before.heroMana);if(equipped)await wait(ids=>ids.every(id=>{const u=goonkMobileState.battleUnits.find(v=>v.stackId===id);return u&&(u.count<1000||u.currentHealth<u.maximumHealth);}),enemy.map(u=>u.stackId));const after=await state();
  assert.equal(before.heroMana-after.heroMana,cost,'Only one hero spell mana cost');
  const losses=enemy.map(u=>{const now=after.battleUnits.find(v=>v.stackId===u.stackId);assert(now);return {id:u.stackId,loss:(u.count-now.count)*u.maximumHealth+u.currentHealth-now.currentHealth};});
  for(const value of losses){const raw=sourceSpells.Implosion.coefficient*(value.id===primary.stackId?power:Math.max(1,Math.min(255,Math.trunc(power*.3))))+sourceSpells.Implosion.base;assert.equal(value.loss,value.id===primary.stackId||equipped?raw:0,'Exact native source main/full versus secondary30percent power');}
  report['implosion-'+equipped]={losses,manaCost:cost};await p.close();console.log('PASS implosion '+equipped);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
 }
 if(!process.env.CASES||process.env.CASES.includes('healing'))for(const [id,type,otherType] of [[38,'core:pikeman','core:halberdier'],[39,'core:wight','core:wraith']])for(const equipped of [true,false]){
  const initialAmount=id===39?200:100,army=[{type:'core:blackDragon',amount:500},{type,amount:initialAmount},{type:otherType,amount:initialAmount}];
  await boot({artifacts:equipped?{misc1:'tum-era:artifact262'}:{backpack:['tum-era:artifact262']},army,battle:true,enemy:'core:dendroidGuard',enemyCount:1000,power:10,skills:{'core:wisdom':'expert','core:sorcery':'expert'}});
  const hero=await sheet(),power=hero.heroWindow.primarySkills[2];await p.locator('[data-hero-close]').tap();let s=await combat();await spell(26);
  for(let attempt=0;attempt<150;++attempt){s=await state();if(s.round>1&&s.heroCanCast)break;if(s.mode==='battle'&&s.activeUnit?.controlled)await cmd(13,s.activeStack,s.round);await p.waitForTimeout(150);}
  await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.round>1&&goonkMobileState.heroCanCast);
  const before=await state(),primary=before.battleUnits.find(u=>!u.enemy&&u.key===type),secondary=before.battleUnits.find(u=>!u.enemy&&u.key===otherType);assert(primary&&secondary,'Partially surviving source targets');
  const hp=u=>u.count*u.maximumHealth-u.maximumHealth+u.currentHealth;
  const cost=await spell(id,primary);if(equipped)await wait(({id,hp})=>{const u=goonkMobileState.battleUnits.find(v=>v.stackId===id);return u&&u.count*u.maximumHealth-u.maximumHealth+u.currentHealth>hp;},{id:secondary.stackId,hp:hp(secondary)});const after=await state(),next=after.battleUnits.find(u=>u.stackId===secondary.stackId);assert(next);
  assert.equal(before.heroMana-after.heroMana,cost,'One healing spell mana charge');
  const source=sourceSpells[id===38?'Resurrection':'Animate Dead'];const expected=Math.min(initialAmount*secondary.maximumHealth-hp(secondary),source.coefficient*Math.max(1,Math.min(255,Math.trunc(power*.3)))+source.base);
  assert.equal(hp(next)-hp(secondary),equipped?expected:0,'Exact secondary healing uses source30percent power');
  const mainAfter=after.battleUnits.find(u=>u.stackId===primary.stackId);assert(mainAfter);assert.equal(hp(mainAfter)-hp(primary),Math.min(initialAmount*primary.maximumHealth-hp(primary),source.coefficient*power+source.base),'Primary receives the original cast exactly once');
  report['healing-'+id+'-'+equipped]={before:before.battleUnits,after:after.battleUnits,cost};await p.close();console.log('PASS healing '+id+' '+equipped);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,report},null,2));
}catch(e){if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(out,'console.log'),consoleLines.join('\n'));}
