import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-conversion-artifacts-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8794';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':'core:christian','primarySkills':{'attack':0,'defence':0,'spellpower':opts.get('power',1),'knowledge':20},'secondarySkills':{'core:wisdom':'expert'},'spellBook':['preset'],'artifacts':dict({'spellbook':'core:spellBook'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':500},{'type':'goonk:bubu','amount':10}])})
if opts.get('battle'):objects.append({'type':'core:monster','subtype':opts.get('enemy','core:ancientBehemoth'),'instanceName':'artifactGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWbhmX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':100,'character':'savage','neverFlees':True}})
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
 const policies=JSON.parse(fs.readFileSync('mod/tum-era/content/config/era-bridge-runtime.json')).artifacts;
 if(!process.env.CASES||process.env.CASES.includes('daily'))for(const id of [202,273,274,277,262])for(const equipped of [true,false]){
  const pairs=policies['tum-era:artifact'+id].dailyConversions;
  const army=pairs.map((pair,i)=>({type:pair.from,amount:7-i}));army.push({type:'goonk:bubu',amount:2});
  await boot({army,artifacts:equipped?{misc1:'tum-era:artifact'+id}:{backpack:['tum-era:artifact'+id]}});
  const before=(await sheet()).troopEquipment.troops;await p.locator('[data-hero-close]').tap();
  await cmd(3);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day===2);
  const after=(await sheet()).troopEquipment.troops;assert.equal(after.length,before.length,'Independent stacks remain separate');
  for(let i=0;i<before.length;++i){
   const expected=equipped&&i<pairs.length?pairs[i].to:before[i].key;
   assert.equal(after[i].key,expected,'Whole original conversion pair '+id+' slot '+i);
   assert.equal(after[i].count,before[i].count,'Counts retained');
   assert.deepEqual(after[i].experience,before[i].experience,'Native experience retained');
  }
  report[id+'-'+equipped]={before,after};console.log('PASS daily conversion '+id+' '+(equipped?'equipped':'backpack'));await p.close();
 }
 if(!process.env.CASES||process.env.CASES.includes('shoot')){
  await boot({artifacts:{},army:[{type:'tum-era:eraCreature318',amount:2},{type:'core:blackDragon',amount:500}],battle:true});
  let s=await combat();
  for(let i=0;i<40&&s.activeUnit?.key!=='tum-era:eraCreature318';++i){
   if(s.canWait||s.activeUnit?.controlled)await cmd(13,s.activeStack,s.round);
   await p.waitForTimeout(200);s=await state();
  }
  await wait(()=>goonkMobileState.activeUnit?.key==='tum-era:eraCreature318'&&goonkMobileState.activeUnit.canShoot);
  s=await state();const source=s.battleUnits.find(u=>u.key==='tum-era:eraCreature318'),enemy=s.battleUnits.find(u=>u.enemy);
  assert.equal(source.remainingShots,12,'Exact original Archer Rider ammunition');
  await cmd(14,4,enemy.occupied[0]);
  await wait(()=>goonkMobileState.battleUnits?.find(u=>u.key==='tum-era:eraCreature318')?.remainingShots===11);
  report.archerRiderShot=(await state()).battleUnits;console.log('PASS original Archer Rider ranged attack/projectile');await p.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,report},null,2));
}catch(e){if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}finally{await browser.close();try{fs.writeFileSync(path.join(out,'console.log'),consoleLines.join('\n'));}catch(e){console.error('Could not retain bounded native console:',e.message);}}
