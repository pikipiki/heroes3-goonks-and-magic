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
async function boot(options){console.log('BOOT',JSON.stringify(options));p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);await installOblivionOverlay(p,process.env.OBLIVION_REVIEW||'/tmp/goonk154-oblivion-review',options.creatureOverrides||{});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(consoleLines.length<4000)consoleLines.push((m.type()+': '+m.text()).slice(0,1000));fs.appendFileSync(path.join(out,'live-console.log'),m.type()+': '+m.text()+'\n');});await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Artifact validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);console.log('MAP READY');}
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

async function chooseSpell(id){
 await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.heroCanCast);await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);
 for(let i=0;i<6&&!(await state()).spellbook.spells.some(s=>s.id===id);++i){const page=(await state()).spellbook.page;await cmd(50,1);await wait(n=>goonkMobileState.spellbook.page!==n,page);}
 const selected=(await state()).spellbook.spells.find(s=>s.id===id);assert(selected?.enabled,'Spell'+id+' enabled for current real battlefield');await cmd(49,id);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.spellTargeting);return selected.cost;
}
const units=s=>s.battleUnits.filter(u=>!u.enemy);

try{
 for(const mode of (process.env.OBLIVION_MODES?.split(',')||['backpack','equipped'])){
  await boot({hero:'core:christian',artifacts:mode==='equipped'?{leftRing:'tum-era:artifact268'}:{backpack:['tum-era:artifact268']},spells:['preset','core:clone','core:meteorShower','core:implosion'],army:[{type:'core:blackDragon',amount:1},{type:'core:pikeman',amount:5},{type:'core:hydra',amount:30},{type:'goonk:bubu',amount:500}],enemyHero:true,enemyArmy:[{type:'core:greenDragon',amount:1}],creatureOverrides:{'core:blackDragon':{speed:40,hitPoints:100000,abilities:{noMorale:{type:'NO_MORALE'},noLuck:{type:'NO_LUCK'}}},'core:pikeman':{speed:30,hitPoints:10,abilities:{noMorale:{type:'NO_MORALE'},noLuck:{type:'NO_LUCK'}}},'core:hydra':{speed:20,hitPoints:100000,abilities:{noMorale:{type:'NO_MORALE'},noLuck:{type:'NO_LUCK'}}},'core:greenDragon':{speed:1,hitPoints:500,abilities:{frozen:{type:'NOT_ACTIVE'},noMorale:{type:'NO_MORALE'},noLuck:{type:'NO_LUCK'}}}}});
  let s=await combat();const original=units(s).find(u=>u.key==='core:pikeman'),mana=s.heroMana;await spell(65,original);await wait(m=>goonkMobileState.heroMana<m,mana);await wait(()=>goonkMobileState.battleUnits.some(u=>u.cloned));s=await state();const clone=s.battleUnits.find(u=>u.cloned&&u.key==='core:pikeman');assert.equal(clone.count,5);assert.notEqual(clone.stackId,original.stackId);
  s=await nextHeroTurn(1);const beforeArmageddon=s.heroMana;await spell(23,original);await wait(m=>goonkMobileState.heroMana<m,beforeArmageddon);await p.waitForTimeout(800);assert.equal((await state()).mode,'battle','Damage-control enemy survives the targeted Meteor Shower');await wait(()=>!goonkMobileState.battleUnits.some(u=>u.key==='core:pikeman'));s=await nextHeroTurn(2);const beforeWin=s.heroMana,target=s.battleUnits.find(u=>u.enemy&&u.key==='core:greenDragon');assert(target);await spell(18,target);
  let finished=false;for(let i=0;i<300;++i){s=await state();if(s.mode==='map'&&!s.hasPath){finished=true;break;}if(s.mode==='dialog'||s.mode==='battle-result')await cmd(1);else if(s.mode==='battle'&&s.canAutoCombat&&!s.autoCombat)await cmd(44,1);await p.waitForTimeout(100);}assert(finished,'Real battle ends after enemy is defeated');s=await state();const army=s.armies.flatMap(a=>a.slots.filter(Boolean));assert(!army.some(u=>u.key==='core:pikeman'),'Original dead troop remains a real casualty');assert.equal(army.find(u=>u.key==='core:blackDragon')?.count,1);assert.equal(army.find(u=>u.key==='core:hydra')?.count,30);assert.equal(army.find(u=>u.key==='goonk:bubu')?.count,500,'Other Goonks remain unchanged');assert(!army.some(u=>u.cloned),'Clone is never added to original army');report[mode]={originalCount:original.count,cloneCount:clone.count,originalStackId:original.stackId,cloneStackId:clone.stackId,army:army.map(u=>({key:u.key,count:u.count}))};await p.screenshot({path:path.join(out,mode+'-casualties.png')});await p.close();console.log('PASS Ring clone and casualty history',mode);fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify(report,null,2));
 }
 assert.deepEqual(errors,[]);const engine=await fetch(origin+'/engine-build.json').then(r=>r.json());fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,engineSHA256:engine.sha256,report},null,2));
}catch(e){if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}finally{await browser.close();fs.writeFileSync(path.join(out,'console.log'),consoleLines.join('\n'));}
