import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-templars-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8794';const browser=await chromium.launch({headless:true});let p;const errors=[],report={};
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':'core:christian','primarySkills':{'attack':0,'defence':0,'spellpower':opts.get('power',1),'knowledge':20},'secondarySkills':{'core:wisdom':'expert'},'spellBook':['preset'],'artifacts':dict({'spellbook':'core:spellBook'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':1},{'type':'goonk:bubu','amount':10}])})
if opts.get('battle'):objects.append({'type':'core:monster','subtype':opts.get('enemy','core:ancientBehemoth'),'instanceName':'artifactGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWbhmX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts.get('enemyCount',100),'character':'savage','neverFlees':True}})
entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['name']='000 - Templar validation';entries['header.json']=json.dumps(h).encode()
for n in ['english.json','french.json']:
 t=json.loads(entries[n]);t['mapName']='000 - Templar validation';entries[n]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(options)]);
async function boot(options){p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.type()+': '+m.text()+'\n'));await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Templar validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);}
async function sheet(){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);return state();}
async function combat(){await cmd(6);await p.waitForTimeout(150);const t=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),t);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canAct&&goonkMobileState.battleUnits?.length);return state();}
const hp=u=>(u.count-1)*u.maximumHealth+u.currentHealth;
const commanderReduction=JSON.parse(fs.readFileSync('mod/wake-of-gods/Mods/commanders/Content/config/commanders/paladin.json')).paladin1.abilities.magicResistance.val;
try{
for(const [id,enemy,damage,charges]of [[269,'core:skeleton',50,1],[278,'core:skeleton',50,3],[331,'core:ogre',35,1],[332,'core:ogre',35,2]]){
 const key='tum-era:eraCreature'+id,light=id<300;
 await boot({artifacts:{},battle:true,enemy,enemyCount:1000,army:[{type:key,amount:3},{type:'core:skeleton',amount:100},{type:'goonk:bubu',amount:100}]});
 let before=await combat();
 for(let turn=0;before.activeUnit?.key!==key&&turn<12;turn++){
  await wait(()=>goonkMobileState.canAct);
  await cmd(13);await p.waitForTimeout(450);before=await state();
 }
 assert.equal(before.activeUnit?.key,key,'Caster reaches its own native turn');
 const actor=before.battleUnits.find(u=>u.key===key);assert.equal(actor.remainingCasts,charges);
 assert.equal(actor.count,3,'Uninjured current-count power fixture');
 assert.equal(actor.morale,light?1:0,'Original positive morale / no morale');
 assert(before.creatureCanCast,'Native creature cast is enabled');
 await cmd(14,1);await wait(s=>goonkMobileState.creatureSpellTargeting||goonkMobileState.battleUnits?.find(u=>u.key===s.key)?.remainingCasts===s.charges-1,{key,charges});
 if((await state()).creatureSpellTargeting){const target=before.battleUnits.find(u=>u.enemy);await cmd(14,3,target.occupied[0]);}
 await wait(s=>!goonkMobileState.creatureSpellTargeting&&goonkMobileState.battleUnits?.find(u=>u.key===s.key)?.remainingCasts===s.charges-1,{key,charges},90000);
 const after=await state();
 const deltas=[];
 for(const old of before.battleUnits){
  const now=after.battleUnits.find(u=>u.stackId===old.stackId);
  const affected=light?old.nativeFlags.undead:!old.nativeFlags.undead;
  const raw=old.armySlot===-2?Math.floor(damage*(100-commanderReduction)/100):damage;
  const lost=hp(old)-(now?hp(now):0);assert.equal(lost,affected?Math.min(raw,hp(old)):0,'Exact original global cast damage for '+old.key);
  deltas.push({key:old.key,enemy:old.enemy,lost});
 }
 report[id]={spellPowerPerCurrentCreature:1,chargesBefore:charges,chargesAfter:charges-1,deltas,actor};
 console.log('PASS native Templar '+id+' original mastery/current-count power, global targets, own troops and charges');await p.close();p=null;
}
await boot({artifacts:{misc1:'core:spiritOfOppression'},battle:true,enemy:'core:skeleton',army:[{type:'tum-era:eraCreature269',amount:3},{type:'core:skeleton',amount:100},{type:'goonk:bubu',amount:100}]});
const suppressed=await combat();assert.equal(suppressed.battleUnits.find(u=>u.key==='tum-era:eraCreature269').morale,0,'Spirit of Oppression suppresses the positive floor');report.suppression={morale:0};await p.close();p=null;
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,errors,report},null,2));
}catch(e){if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}finally{await browser.close();}
