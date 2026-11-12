import {installOblivionOverlay} from './oblivion-overlay.mjs';
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-oblivion-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8799';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':opts.get('hero','core:christian'),'primarySkills':{'attack':opts.get('attack',4),'defence':opts.get('defense',7),'spellpower':opts.get('power',10),'knowledge':20},'secondarySkills':opts.get('skills',{'core:wisdom':'expert'}),'spellBook':opts.get('spells',['preset','core:implosion','core:resurrection','core:animateDead','core:armageddon']),'artifacts':dict({'spellbook':'core:spellBook'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':500},{'type':'goonk:bubu','amount':10}])})
if opts.get('enemyHero'):
 hero=next(o for o in objects if o['instanceName']=='goonkHero')
 objects.append({'type':'core:hero','subtype':'core:knight','instanceName':'enemyHero','x':11,'y':11,'l':0,'template':hero['template'],'options':{'owner':'blue','type':'core:orrin','primarySkills':{'attack':10,'defence':20,'spellpower':3,'knowledge':5},'artifacts':opts.get('enemyArtifacts',{}),'army':opts.get('enemyArmy',opts['army'])}})
elif opts.get('battle'):
 objects.append({'type':'core:monster','subtype':opts.get('enemy','core:ancientBehemoth'),'instanceName':'artifactGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWbhmX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts.get('enemyCount',100),'character':'savage','neverFlees':True}})

entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['allowedArtifacts']={'anyOf':['core:speculum']};h['name']='000 - Artifact validation';entries['header.json']=json.dumps(h).encode()
for n in ['english.json','french.json']:
 t=json.loads(entries[n]);t['mapName']='000 - Artifact validation';entries[n]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(options)]);
async function boot(options){console.log('BOOT',JSON.stringify(options));p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);await installOblivionOverlay(p,process.env.OBLIVION_REVIEW||'/tmp/goonk154-oblivion-review');p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(consoleLines.length<4000)consoleLines.push((m.type()+': '+m.text()).slice(0,1000));});await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Artifact validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('MAP READY');}
async function sheet(){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);return state();}
async function combat(){await cmd(6);await p.waitForTimeout(150);const t=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),t);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.battleUnits?.length);return state();}
async function spell(id,target){
 await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.heroCanCast);await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);
 for(let page=0;page<6&&!(await state()).spellbook.spells.some(s=>s.id===id);++page){const previous=(await state()).spellbook.page;assert((await state()).spellbook.pages>1,'Requested spell absent from known spells: '+id);await cmd(50,1);await wait(n=>goonkMobileState.spellbook.page!==n,previous);}
 const selected=(await state()).spellbook.spells.find(s=>s.id===id);assert(selected?.enabled,'Requested spell is eligible');
 await cmd(49,id);await wait(()=>goonkMobileState.mode==='battle');if(target)await cmd(14,3,target.occupied[0]);
 await p.waitForTimeout(800);return selected.cost;
}

const hp=u=>u.count?Math.max(0,u.count-1)*u.maximumHealth+u.currentHealth:0;
async function nextHeroTurn(round){
 for(let i=0;i<500;++i){const s=await state();if(s.mode==='battle'&&s.round>round&&s.heroCanCast&&s.canUseMagic)return s;if(s.mode==='battle'&&s.canAct&&s.activeUnit?.controlled)await cmd(13,s.activeStack,s.round);await p.waitForTimeout(80);}throw Error('No next hero turn');
}
try{
 for(const mode of (process.env.OBLIVION_MODES?.split(',')||['equipped','backpack']))for(const [id,key]of [[38,'core:hydra'],[39,'core:vampireLord']]){
  if(process.env.CASES&&!process.env.CASES.split(',').includes('revival'))continue;
  const army=[{type:'core:blackDragon',amount:500},{type:'core:hydra',amount:100},{type:'core:vampireLord',amount:100},{type:'core:peasant',amount:1}];
  await boot({artifacts:mode==='equipped'?{leftRing:'tum-era:artifact268'}:{backpack:['tum-era:artifact268']},army,battle:true,enemyCount:1000});let s=await combat();
  const firstRound=s.round;await spell(26);await wait(m=>goonkMobileState.heroMana<m,s.heroMana);s=await nextHeroTurn(firstRound);const target=s.battleUnits.find(u=>!u.enemy&&u.key===key);assert(target&&target.count>0&&target.count<100,'Real Armageddon wounds');
  const before={hp:hp(target),mana:s.heroMana,count:target.count},cost=await spell(id,target);await wait(m=>goonkMobileState.heroMana<m,before.mana);s=await state();const healed=s.battleUnits.find(u=>u.stackId===target.stackId);assert.equal(before.mana-s.heroMana,cost,'The actual resisted cast still spends native mana');
  if(mode==='equipped')assert.equal(hp(healed),before.hp,'Ring resists without healing');else assert(hp(healed)>before.hp,'Backpack restores ordinary healing');
  const peasant=s.battleUnits.find(u=>!u.enemy&&u.key==='core:peasant');assert(!peasant||peasant.count===0,'Casualty remains dead');
  report[mode+'-'+id]={before,after:{hp:hp(healed),count:healed.count,mana:s.heroMana},cost};await p.screenshot({path:path.join(out,mode+'-'+id+'.png')});await p.close();console.log('PASS Ring revival',mode,id);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
 }

 if(!process.env.CASES||process.env.CASES.split(',').includes('necromancy'))for(const mode of ['baseline','equipped','backpack','enemy','both']){
  const worn=mode==='equipped'||mode==='both',enemy=mode==='enemy'||mode==='both';
  await boot({artifacts:worn?{leftRing:'tum-era:artifact268'}:mode==='backpack'?{backpack:['tum-era:artifact268']}:{},skills:{'core:necromancy':'expert'},army:[{type:'core:blackDragon',amount:500},{type:'goonk:bubu',amount:2}],battle:true,enemy:'core:gnoll',enemyCount:10,...(enemy?{enemyHero:true,enemyArtifacts:{leftRing:'tum-era:artifact268'},enemyArmy:[{type:'core:gnoll',amount:10}]}:{})});
  await combat();let finished=false;
  for(let i=0;i<500;++i){const current=await state();if(current.mode==='map'&&!current.hasPath){finished=true;break;}if(current.mode==='battle'&&!current.autoCombat&&current.canAutoCombat)await cmd(44,1);else if(current.mode==='dialog'||current.mode==='battle-result')await cmd(1);await p.waitForTimeout(100);}
  assert(finished,'Real battle finishes');const after=await state(),army=after.armies.flatMap(a=>a.slots.filter(Boolean));assert.equal(army.find(u=>u.key==='goonk:bubu')?.count,2,'Other troops remain unchanged');
  const raised=army.find(u=>u.key==='third-upgrades:tumSkeletonKnight');if(worn||enemy)assert.equal(raised,undefined,'Either equipped hero suppresses Necromancy');else assert(raised?.count>0,'Ordinary Necromancy remains active');
  report['necromancy-'+mode]={raised:raised?{key:raised.key,count:raised.count}:null,army};await p.screenshot({path:path.join(out,'necromancy-'+mode+'.png')});await p.close();console.log('PASS Ring Necromancy',mode);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
 }
 assert.deepEqual(errors,[]);const engine=await fetch(origin+'/engine-build.json').then(r=>r.json());fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,engineSHA256:engine.sha256,report,scope:'Bounded real revival and/or Necromancy controls selected by CASES. Corpse geometry, clone/casualty edges and Sacrifice remain separate obligations.'},null,2));
}catch(e){if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(out,'console.log'),consoleLines.join('\n'));}
