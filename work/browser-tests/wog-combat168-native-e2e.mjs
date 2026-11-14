/** Private Combat168 harness: production policies and pre-launch HP/speed fixtures. */
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';
const [width,height]=(process.env.GOONK_TEST_VIEWPORT||'844x390').split('x').map(Number),viewport={width,height};
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-combat168-native';fs.mkdirSync(out,{recursive:true});
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8794',browser=await chromium.launch({headless:true});
let p,consoleCount=0;
const errors=[],report={provenance:{origin,viewport,privateOnly:true,policies:'production-unmodified',fixtures:'HP and speed only; real hero spells'}};
const wait=(f,a,t=60000)=>p.waitForFunction(f,a,{timeout:t});
const cmd=(...a)=>Promise.race([p.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Native command timed out '+a.join(','))),20000);t.unref();})]);
const state=()=>Promise.race([p.evaluate(()=>goonkMobileState),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Native state timed out')),10000);t.unref();})]);
const fixture=options=>execFileSync('python3',['-c',`import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1]);z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':opts.get('hero','core:christian'),'experience':opts.get('experience',0),'primarySkills':{'attack':0,'defence':0,'spellpower':opts.get('power',1),'knowledge':opts.get('knowledge',20)},'secondarySkills':opts.get('skills',{'core:wisdom':'expert'}),'spellBook':opts.get('spells',['preset']),'artifacts':dict({'spellbook':'core:spellBook'},**opts.get('artifacts',{})),'army':opts.get('army',[{'type':'goonk:bubu','amount':10}])})
if opts.get('enemyHero'):
 e=opts['enemyHero'];objects.append({'type':'core:hero','subtype':'core:knight','instanceName':'neutralCounterHero','x':10,'y':11,'l':0,'template':{'animation':'AH00_E.DEF','mask':['AV'],'visitableFrom':['+++','+-+','+++']},'options':{'owner':'blue','type':e.get('hero','core:orrin'),'experience':e.get('experience',0),'primarySkills':{'attack':0,'defence':0,'spellpower':e.get('power',1),'knowledge':20},'secondarySkills':e.get('skills',{}),'army':e['army']}})
 if e.get('spells'):objects[-1]['options'].update({'spellBook':e['spells'],'artifacts':dict({'spellbook':'core:spellBook'},**e.get('artifacts',{}))})
if opts.get('battle'):objects.append({'type':'core:monster','subtype':opts.get('enemy','core:ancientBehemoth'),'instanceName':'artifactGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWbhmX0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts.get('enemyAmount',100),'character':'savage','neverFlees':True}})
entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['name']='000 - Eighth native validation'
if opts.get('enemyHero'):h['players']['blue']['canPlay']='PlayerOnly'
entries['header.json']=json.dumps(h).encode()
for name in ['english.json','french.json']:
 t=json.loads(entries[name]);t['mapName']='000 - Eighth native validation';entries[name]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`,JSON.stringify(options)]);
async function boot(options){
 p=await browser.newPage({viewport,hasTouch:true,bypassCSP:true});await silenceTestAudio(p);
if(options.combat168Controls)await p.addInitScript(controls=>{const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f);},get:()=>function(...args){const invoke=prior?.get?prior.get.call(m):main,root='/home/web_user/.local/share/vcmi/Mods/tum-era/',manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'}));for(const value of Object.values(controls))for(const key of Object.keys(value))if(!['hitPoints','speed'].includes(key))throw Error('Combat168 fixture allows HP/speed only');manifest.creatures.push('config/combat168-test-controls.json');m.FS.writeFile(root+'content/config/combat168-test-controls.json',JSON.stringify(controls));m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));return invoke.apply(m,args);}});}});},options.combat168Controls);
if(options.disableCommanders)await p.addInitScript(()=>{const previous=Object.getOwnPropertyDescriptor(window,'Module');let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{previous?.set?.call(window,m);current=m;const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f);},get:()=>function(...args){const invoke=prior?.get?prior.get.call(m):main,file='/home/web_user/.local/share/vcmi/Mods/tum-era/mod.json',manifest=JSON.parse(m.FS.readFile(file,{encoding:'utf8'}));manifest.settings??={};manifest.settings.modules??={};manifest.settings.modules.commanders=false;m.FS.writeFile(file,JSON.stringify(manifest));return invoke.apply(m,args);}});}});});

 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(consoleCount++<4000)fs.appendFileSync(path.join(out,'console.log'),(m.type()+': '+m.text()).slice(0,1500)+'\n');});
 await p.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
 const metadata=await(await p.request.get(origin+'/engine-build.json')).json();
 if(process.env.EXPECTED_ENGINE_SHA)assert.equal(metadata.sha256,process.env.EXPECTED_ENGINE_SHA,'Clean native engine provenance');report.engineMetadata=metadata;
 await p.goto(origin+'/game.html?mobile=1');
 await Promise.race([wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000),p.waitForEvent('console',{predicate:m=>m.text().includes('FATAL ERROR ENCOUNTERED'),timeout:240000}).then(()=>{throw Error('Native boot fatal: inspect bounded console.log');})]);
 await p.evaluate(bytes=>{for(const name of['001-Goonks.vmap','003-Goonks-WoG.vmap']){const file='/home/web_user/.local/share/vcmi/Maps/'+name;try{Module.FS.stat(file);Module.FS.writeFile(file,new Uint8Array(bytes));}catch{}}},[...fixture(options)]);
 await cmd(20,options.enemyHero?2:1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);
 await wait(()=>goonkMobileState.maps?.some(m=>m.name==='000 - Eighth native validation'));
 const map=(await state()).maps.find(m=>m.name==='000 - Eighth native validation');await p.locator('#mobile-map-select').selectOption(String(map.index),{force:true});await wait(()=>goonkMobileState.selectedMap==='000 - Eighth native validation');await p.locator('[data-ui=begin]').tap();
 if(options.enemyHero)for(let n=0;n<4;n++){await wait(()=>['map','dialog'].includes(goonkMobileState.mode));if((await state()).mode==='map')break;await cmd(1);await p.waitForTimeout(100);}
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
}
async function resolve(maximumTicks=350){for(let i=0;i<maximumTicks;i++){const s=await state();if(s.mode==='map'&&!s.hasPath){await p.waitForTimeout(800);const settled=await state();if(settled.mode==='map'&&!settled.hasPath)return settled;continue;}if(s.mode==='battle'&&s.canAutoCombat&&!s.autoCombat)await cmd(44,1);else if(s.mode==='dialog')await cmd(1);await p.waitForTimeout(100);}throw Error('Battle did not resolve');}
async function sheet(){await p.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);return state();}
async function combat(tileOffset=64){await cmd(6);await p.waitForTimeout(150);const t=await p.evaluate(offset=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+offset,y:v.y+v.h/2};},tileOffset);await p.evaluate(t=>Module._vcmiMobilePointer(t.x,t.y,1),t);await wait(()=>goonkMobileState.hasPath);await cmd(2);await wait(()=>goonkMobileState.mode==='battle');await cmd(15);await wait(()=>goonkMobileState.canUseMagic&&goonkMobileState.battleUnits?.length);return state();}
try{const{runCombat168}=await import('./combat168-cases.mjs');await runCombat168({boot,combat,resolve,sheet,state,cmd,wait,page:()=>p,out,report});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,errors,report},null,2));}catch(e){console.error(e);if(p){const nativeLogs=await p.evaluate(()=>{try{const dir='/home/web_user/.cache/vcmi';return Object.fromEntries(Module.FS.readdir(dir).filter(n=>/log\.txt$/i.test(n)).map(n=>[n,Module.FS.readFile(dir+'/'+n,{encoding:'utf8'}).slice(-120000)]));}catch{return{};}}).catch(()=>({}));fs.writeFileSync(path.join(out,'failure-native-logs.json'),JSON.stringify(nativeLogs,null,2));fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});}process.exitCode=1;}finally{await browser.close();}
