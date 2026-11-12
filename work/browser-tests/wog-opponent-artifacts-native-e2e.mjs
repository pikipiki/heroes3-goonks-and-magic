import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-opponent-artifacts-native';fs.mkdirSync(out,{recursive:true});const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8794';const browser=await chromium.launch({headless:true});let p;const errors=[],report={},consoleLines=[];
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
const clamped=v=>Math.max(-3,Math.min(3,v));
const summary=s=>s.battleUnits.map(u=>({enemy:u.enemy,key:u.key,eraSlot:u.eraSlot,morale:u.morale,luck:u.luck}));
try{
 await boot({artifacts:{},battle:true});const baseline=summary(await combat());
 assert(baseline.every(u=>Number.isInteger(u.luck)),'Native bridge exposes actual battle luck');await p.close();
 const definitions=JSON.parse(fs.readFileSync('mod/tum-era/content/config/reviewed-opponent-artifacts.json'));
 const slots={183:'neck',184:'misc1',185:'misc1',186:'misc1',187:'misc1',188:'leftRing',249:'leftRing',250:'misc1',252:'neck'};
 async function check(artifacts,penalties,label){
  await boot({artifacts,battle:true});const s=summary(await combat());
  for(const u of s){const before=baseline.find(b=>b.key===u.key&&b.enemy===u.enemy&&b.eraSlot===u.eraSlot);assert(before);
   assert.equal(u.morale,clamped(before.morale+(u.enemy?(penalties.MORALE||0):0)),label+' morale scope');
   assert.equal(u.luck,clamped(before.luck+(u.enemy?(penalties.LUCK||0):0)),label+' luck scope');
  }
  report[label]=s;console.log('PASS opponent artifact '+label);await p.close();
 }
 for(const [id,slot]of Object.entries(slots)){
  const penalties=Object.fromEntries(Object.values(definitions['artifact'+id].bonuses).map(b=>[b.type,b.val]));
  await check({[slot]:'tum-era:artifact'+id},penalties,id+'-equipped');
  await check({backpack:['tum-era:artifact'+id]}, {},id+'-backpack');
 }
 await check({misc1:'tum-era:artifact184',misc2:'tum-era:artifact184'},{LUCK:-2},'same identity only once');
 await check({neck:'tum-era:artifact183',leftRing:'tum-era:artifact188'},{MORALE:-3},'different identities add');
 await check({misc1:'tum-era:artifact185',misc2:'tum-era:artifact187'},{LUCK:-2},'different luck identities add');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,baseline,report},null,2));
}catch(e){if(p){fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}console.error(e);process.exitCode=1;}finally{await browser.close();try{fs.writeFileSync(path.join(out,'console.log'),consoleLines.join('\n'));}catch(e){console.error('Could not retain bounded native console:',e.message);}}
