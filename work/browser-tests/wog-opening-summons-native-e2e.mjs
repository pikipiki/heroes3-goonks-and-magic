import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-opening-summons-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8794';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':'core:christian','primarySkills':{'attack':0,'defence':0,'spellpower':opts.get('power',1),'knowledge':20},'secondarySkills':{'core:wisdom':'expert'},'spellBook':['preset'],'artifacts':dict({'spellbook':'core:spellBook'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':500},{'type':'goonk:bubu','amount':10}])})
if opts.get('battle'):objects.append({'type':'core:monster','subtype':opts.get('enemy','core:ancientBehemoth'),'instanceName':'artifactGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWbhmX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts.get('enemyCount',100),'character':'savage','neverFlees':True}})
entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['allowedArtifacts']={'anyOf':['core:speculum']};h['name']='000 - Artifact validation';entries['header.json']=json.dumps(h).encode()
for n in ['english.json','french.json']:
 t=json.loads(entries[n]);t['mapName']='000 - Artifact validation';entries[n]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(options)]);
async function boot(options){p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(consoleLines.length<4000)consoleLines.push((m.type()+': '+m.text()).slice(0,1000));});await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Artifact validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);}
async function sheet(){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);return state();}
async function combat(){await cmd(6);await p.waitForTimeout(150);const t=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),t);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.battleUnits?.length);return state();}
try{
 const source=JSON.parse(fs.readFileSync(process.env.OPENING_POLICY||'/tmp/goonk-opening-summons-review-146/runtime.candidate.json')).artifacts;
 if(!process.env.CASES||process.env.CASES.includes('summons'))for(const [id,slot] of [[219,'misc1'],[231,'rightHand'],[279,'misc1']])for(const power of [1,9]){
  await boot({artifacts:{[slot]:'tum-era:artifact'+id},power,battle:true,enemy:'core:pikeman',enemyCount:1});
  const before=await sheet();const actualPower=before.heroWindow.primarySkills[2];
  await p.locator('[data-hero-close]').tap();
  const s=await combat(),own=s.battleUnits.filter(u=>!u.enemy),policies=source['tum-era:artifact'+id].openingSummons;
  const actual=[];
  for(const policy of policies){
   const count=Math.max(1,policy.encodedPower<0?Math.trunc(-policy.encodedPower*actualPower/1000):policy.encodedPower||actualPower);
   const units=own.filter(u=>u.key===policy.creature);assert.equal(units.length,1,'One summoned stack per source entry');
   assert.equal(units[0].count,count,'Exact source count '+id+' power '+power);
   assert(units[0].eraSlot>=2,'Summoned after original source army slots');
   actual.push({key:units[0].key,count:units[0].count,eraSlot:units[0].eraSlot});
  }
  assert(s.heroMana>=before.heroMana,'Opening summons spend no mana; unrelated native regeneration may increase the pool');
  const occupied=own.flatMap(u=>u.occupied);assert.equal(new Set(occupied).size,occupied.length,'Wide summoned footprints do not overlap');
  assert.deepEqual(actual.map(u=>u.eraSlot),actual.map(u=>u.eraSlot).sort((a,b)=>a-b),'Source cfg order');
  report[id+'-'+power]={actualPower,actual,manaBefore:before.heroMana,mana:s.heroMana};
  if(id===219&&power===1){
   await cmd(14);await wait(()=>goonkMobileState.mode==='spellbook');await cmd(51,0);
   for(let page=0;page<5&&!(await state()).spellbook.spells.some(s=>s.id===66);++page){const previous=(await state()).spellbook.page;await cmd(50,1);await wait(n=>goonkMobileState.spellbook.page!==n,previous);}
   assert((await state()).spellbook.spells.some(s=>s.id===66&&s.enabled),'Ordinary fire elemental available after artifact summons');await cmd(49,66);
   await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.battleUnits?.some(u=>!u.enemy&&u.key==='core:fireElemental'));
   const after=await state();assert(after.heroMana<before.heroMana,'Ordinary elemental cast works after four different artifact summons');
   report.elementalCast={mana:after.heroMana,units:after.battleUnits.filter(u=>!u.enemy)};
  }
  if(id===219&&power===1){
   let settled=0;
   for(let attempt=0;attempt<1500;++attempt){const v=await state();
    if(v.mode==='battle'){if(v.canAutoCombat&&!v.autoCombat)await cmd(44,1);}
    else if(v.mode==='dialog'){settled=0;if(v.dialogKind==='commander-level-up'){const choice=v.dialogPresentation?.choices?.find(c=>c.selectable);if(choice)await cmd(96,choice.skillId);}await cmd(1);}
    else if(v.mode==='map'&&!v.hasPath){if(++settled>=8)break;}
    await p.waitForTimeout(120);
   }
   const after=await sheet();
   assert(after.troopEquipment.troops.every(u=>['core:blackDragon','goonk:bubu'].includes(u.key)),'Artifact summons never enter the adventure army');
   report.afterBattle=after.troopEquipment.troops;
  }
  console.log('PASS original opening summons '+id+' at power '+power);await p.close();
 }
 if(!process.env.CASES||process.env.CASES.includes('backpack'))for(const id of [219,231,279]){
  await boot({artifacts:{backpack:['tum-era:artifact'+id]},power:9,battle:true});
  const s=await combat();assert.equal(s.battleUnits.filter(u=>!u.enemy&&u.armySlot!==-2).length,2,'Backpack does not summon; native commander remains present');
  report['backpack-'+id]={units:s.battleUnits.filter(u=>!u.enemy)};await p.close();
 }
 if(!process.env.CASES||process.env.CASES.includes('shield')){await boot({artifacts:{misc1:'tum-era:artifact219',leftHand:'tum-era:artifact210'},power:9,battle:true});
 const withShield=await combat();for(const u of withShield.battleUnits.filter(u=>!u.enemy))assert.equal(u.currentHealth,u.maximumHealth,'Opening shield immunity covers the summoned units');
 assert.equal(withShield.battleUnits.filter(u=>!u.enemy&&u.armySlot!==-2).length,6);report.shield=withShield.battleUnits;await p.close();}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,report},null,2));
}catch(e){if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}finally{await browser.close();try{fs.writeFileSync(path.join(out,'console.log'),consoleLines.join('\n'));}catch(e){console.error('Could not retain bounded native console:',e.message);}}
