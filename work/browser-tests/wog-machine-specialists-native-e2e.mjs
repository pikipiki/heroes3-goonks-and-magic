import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-machine-specialists-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8794';const browser=await chromium.launch({headless:true});let p;const errors=[],report={};
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t}),cmd=(...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),state=()=>p.evaluate(()=>goonkMobileState);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':opts.get('hero','core:christian'),'experience':opts.get('experience',0),'primarySkills':{'attack':0,'defence':0,'spellpower':opts.get('power',1),'knowledge':20},'secondarySkills':opts.get('skills',{'core:wisdom':'expert'}),'spellBook':['preset'],'artifacts':dict({'spellbook':'core:spellBook'},**opts['artifacts']),'army':opts.get('army',[{'type':'core:blackDragon','amount':1},{'type':'goonk:bubu','amount':10}])})
if opts.get('battle'):objects.append({'type':'core:monster','subtype':opts.get('enemy','core:ancientBehemoth'),'instanceName':'artifactGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWbhmX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts.get('enemyAmount',100),'character':'savage','neverFlees':True}})
entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['name']='000 - Artifact validation';entries['header.json']=json.dumps(h).encode()
for n in ['english.json','french.json']:
 t=json.loads(entries[n]);t['mapName']='000 - Artifact validation';entries[n]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(options)]);
async function boot(options){p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.type()+': '+m.text()+'\n'));await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));await p.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await p.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture(options)]);await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - Artifact validation');await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);}
async function sheet(){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);return state();}
async function combat(){await cmd(6);await p.waitForTimeout(150);const t=await p.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),t);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.battleUnits?.length);return state();}
async function resolveBattle(started=false){for(let i=0;i<360;i++){const s=await state();if(s.mode==='map'&&!s.hasPath){if(started)return s;}else if(s.mode==='battle'){started=true;if(!s.autoCombat&&s.canAutoCombat)await cmd(44,1);}else if(s.mode==='dialog'||s.mode==='battle-result')await cmd(1);await p.waitForTimeout(150);}throw Error('Battle did not finish');}
try{
 const artifacts={mach1:'core:ballista',mach2:'core:ammoCart',mach3:'core:firstAidTent'};
 const results=[];
 for(const hero of ['core:edric','core:gurnisson']){
  await boot({hero,experience:100000,artifacts,battle:true,enemyAmount:process.env.MACHINE_ACTIONS==='1'?6:20,army:[{type:'core:blackDragon',amount:10},{type:'goonk:bubu',amount:10}]});
  const before=await sheet();const level=before.heroWindow.level;
  await p.locator('[data-hero-close]').tap();
  if(process.env.MACHINE_ACTIONS==='1')await p.evaluate(()=>{window.machineActionFrames=[];addEventListener('goonk-state',({detail:s})=>{if(s?.mode!=='battle'||machineActionFrames.length>=3000)return;machineActionFrames.push({round:s.round,active:s.activeStack,units:(s.battleUnits||[]).filter(u=>!u.enemy).map(u=>({key:u.key,id:u.stackId,count:u.count,hp:u.currentHealth,max:u.maximumHealth,shots:u.remainingShots}))});});});
  const battle=await combat();
  const machines=battle.battleUnits.filter(u=>!u.enemy&&['core:ballista','core:ammoCart','core:firstAidTent'].includes(u.key));
  assert.equal(machines.length,3);
  const entry={hero,level,units:machines,control:battle.battleUnits.find(u=>!u.enemy&&u.key==='goonk:bubu')};results.push(entry);
  if(process.env.MACHINE_ACTIONS==='1'){
   await cmd(44,1);const after=await resolveBattle(true),frames=await p.evaluate(()=>machineActionFrames);assert.equal(after.heroId,before.heroId,'Native autocombat ends with the original hero');
   fs.writeFileSync(path.join(out,hero.split(':').at(-1)+'-action-frames.json'),JSON.stringify(frames,null,2));const log=await p.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).slice(-100000);}catch{return '';}});fs.writeFileSync(path.join(out,hero.split(':').at(-1)+'-native-actions.log'),log);
   // Autocombat intentionally hides activeStack; the Ammo Cart can keep shots
   // unchanged. The native server trace still records SHOOT9 and STACK_HEAL13.
   const ballista=machines.find(u=>u.key==='core:ballista'),tent=machines.find(u=>u.key==='core:firstAidTent');assert(log.includes("stackNumber '"+ballista.stackId+"', actionType '9'"),'Native server executes the ballista shot');assert(log.includes("stackNumber '"+tent.stackId+"', actionType '13'"),'Native server executes the First Aid Tent heal');
   let previous,healed=false;for(const f of frames){const u=f.units.find(u=>u.key==='core:blackDragon');if(!u)continue;const health=(u.count-1)*u.max+u.hp;if(previous!==undefined&&health>previous)healed=true;previous=health;}assert(healed,'Native First Aid Tent actually heals a wounded dragon');
   entry.actions={ballistaActed:true,firstAidHealed:true,autocombatFinished:true,frames,after};
  }
  await p.close();p=null;
 }
 fs.writeFileSync(path.join(out,'observed.json'),JSON.stringify(results,null,2));
 const [base,specialist]=results;assert.equal(base.level,specialist.level);
 const percent=specialist.level+9,defense=Math.floor(specialist.level/7)+1;
 for(const key of ['core:ammoCart','core:firstAidTent']){
  const a=base.units.find(u=>u.key===key),b=specialist.units.find(u=>u.key===key);
  assert.equal(b.maximumHealth,Math.floor(a.maximumHealth*(100+percent)/100));
  assert.equal(b.defense,a.defense+defense);
  assert.equal(b.attack,a.attack);
  assert.equal(b.damageMax,a.damageMax>0?a.damageMax+Math.floor(specialist.level/10):a.damageMax);
 }
 assert.equal(specialist.control.maximumHealth,base.control.maximumHealth);
 assert.equal(specialist.control.damageMax,base.control.damageMax);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2));
 console.log('Gurnisson source progression applies to three machines and preserves unrelated Goonks.');
}catch(e){if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}throw e;}
finally{await browser.close();}
