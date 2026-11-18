/** Private ERA779 visit/save controls; never writes a published map/config. */
import {chromium} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8803';
const engine=path.resolve(process.env.ERA779_ENGINE_PATH||'work/downloads/era-script779-source241-engine');
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-era779-native';fs.mkdirSync(out,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const viewport={width:844,height:390},report={engineSha256:digest(fs.readFileSync(path.join(engine,'vcmiclient.wasm'))),cases:[]};
const fixture=()=>execFileSync('python3',['-c',`import zipfile,json,io,importlib.util
z=zipfile.ZipFile('maps/000-Goonk.vmap');entries={n:z.read(n) for n in z.namelist()};objects=json.loads(entries['objects.json']);objects=[o for o in objects if o['instanceName'] in ['goonkTown','goonkHero','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':o['options'].update({'type':'core:orrin','experience':15000,'secondarySkills':{'core:learning':'expert'},'army':[{'type':'core:blackDragon','amount':10}]})
 if o['instanceName'] in ['goonkTown','enemyTown']:o['options']['buildings']={'allOf':['core:villageHall','core:fort'],'noneOf':['core:tavern']}
objects.append({'type':'core:hero','subtype':'core:knight','instanceName':'privateBlue','x':9,'y':15,'l':0,'template':next(o['template'] for o in objects if o['instanceName']=='goonkHero'),'options':{'owner':'blue','type':'core:christian','experience':15000,'secondarySkills':{'core:learning':'expert'},'army':[{'type':'core:blackDragon','amount':10}]}})
objects.append({'type':'core:learningStone','subtype':'core:learningStone','instanceName':'privateBlueStone','x':10,'y':15,'l':0,'template':{'animation':'AVSgzbo0','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}})
for i,x in enumerate([10,12]):objects.append({'type':'core:learningStone','subtype':'core:learningStone','instanceName':'privateLearning'+str(i),'x':x,'y':11,'l':0,'template':{'animation':'AVSgzbo0','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}})
entries['objects.json']=json.dumps(objects).encode();h=json.loads(entries['header.json']);h['name']='000 - ERA779 native learning';h['players']['red']['mainTown']['generateHero']=False;h['players']['blue']['mainTown']['generateHero']=False;h['players']['blue']['mainHero']='privateBlue';h['players']['blue']['heroes']={'privateBlue':{'type':'core:christian'}};entries['header.json']=json.dumps(h).encode()
for n in ['english.json','french.json']:
 t=json.loads(entries[n]);t['mapName']='000 - ERA779 native learning';entries[n]=json.dumps(t).encode()
spec=importlib.util.spec_from_file_location('n','scripts/normalize-map-instances.py');n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n);entries=n.normalize(entries);out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in entries.items():z.writestr(name,data)
import sys;sys.stdout.buffer.write(out.getvalue())`]);
const cleanManifest=process.env.GOONK_CLEAN_MANIFEST==='1'?JSON.parse(execFileSync('git',['show','HEAD:mod/tum-era/mod.json'],{encoding:'utf8'})):null;
const map=fixture();fs.writeFileSync(out+'/private-learning.vmap',map);
const browser=await chromium.launch({headless:true});let page;const errors=[];
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...a)=>page.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]),wait=(f,a,t=90000)=>page.waitForFunction(f,a,{timeout:t});
async function createPage(enabled,save,{specialist=false}={}){
 page=await browser.newPage({viewport,hasTouch:true,bypassCSP:true});await silenceTestAudio(page);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text()+'\n'));

 await page.addInitScript(({enabled,specialist,cleanManifest})=>{
  sessionStorage.setItem('heroes-goonk.storage-failed','true');let current;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{
   current=m;let main;Object.defineProperty(m,'callMain',{configurable:true,set:f=>main=f,get:()=>function(...args){
    if(cleanManifest)m.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/mod.json',JSON.stringify(cleanManifest));
    const value=JSON.stringify({eraScripts:{schemaVersion:1,profile:'era-scripts',rules:{'779':enabled}}});
    m.FS.writeFile('/config/era-script-rules.json',value);
    const config='/home/web_user/.local/share/vcmi/Mods/wake-of-gods/Mods/mapSupport/Content/config/era-script-rules.json';
    m.FS.mkdirTree(config.slice(0,config.lastIndexOf('/')));m.FS.writeFile(config,value);
    if(specialist){const root='/home/web_user/.local/share/vcmi/Mods/tum-era/',manifest=JSON.parse(m.FS.readFile(root+'mod.json',{encoding:'utf8'}));manifest.heroes=[...(manifest.heroes||[]),'config/era779-private-heroes.json'];m.FS.writeFile(root+'mod.json',JSON.stringify(manifest));m.FS.writeFile(root+'content/config/era779-private-heroes.json',JSON.stringify({'core:orrin':{specialty:{secondary:'core:learning',stepSize:5,bonuses:{privateIgnoredExperienceBoost:{type:'HERO_EXPERIENCE_GAIN_PERCENT',val:300,valueType:'PERCENT_TO_BASE'}}}}}));}
    return main.apply(m,args);
   }});
  }});
 },{enabled,specialist,cleanManifest});
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 if(save){
  await page.evaluate(bytes=>{const root='/home/web_user/.local/share/vcmi/Saves/';Module.FS.mkdirTree(root);Module.FS.writeFile(root+'Goonk-auto.vsgm1',new Uint8Array(bytes));},[...save]);
  await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);
  const entry=(await state()).maps.find(m=>/Goonk-auto/i.test(m.name+' '+m.file));assert(entry);await cmd(27,entry.index);await wait(index=>goonkMobileState.selectedIndex===index,entry.index);await cmd(22);
 }else{
  await page.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...map]);
  await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap==='000 - ERA779 native learning');await cmd(22);
 }
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
}
async function hero(){await cmd(55);await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);const h=(await state()).heroWindow;await cmd(63);await wait(()=>goonkMobileState.mode==='map');return h;}
async function visit(){
 await cmd(6);await page.waitForTimeout(200);
 const target=await page.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+64,y:v.y+v.h/2};});
 await page.evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),target);await wait(()=>goonkMobileState.hasPath);await cmd(2);
 const dialogs=[];let settled=0;
 for(let i=0;i<300;i++){
  const s=await state();fs.writeFileSync(out+'/progress.json',JSON.stringify(s,null,2));
  if(s.mode==='dialog'){
   dialogs.push(s.dialogPresentation);await page.screenshot({path:out+'/dialog-'+report.cases.length+'-'+dialogs.length+'.png'});
   if(s.dialogPresentation?.title==='Level up'||s.dialogKind==='commander-level-up'){
    const choice=s.dialogPresentation.choices?.find(c=>c.selectable);if(choice)await page.evaluate(r=>Module._vcmiMobilePointer(Math.round(r.x+r.w/2),Math.round(r.y+r.h/2),1),choice.rect);
   }
   await cmd(1);
   settled=0;
  // A visited one-shot object may retain its completed path marker. The
  // stable map and save permission prove that its interaction has finished.
  }else if(s.mode==='map'&&!s.heroMoving&&s.autosaveAllowed&&dialogs.length){if(++settled>=8)return dialogs;}else settled=0;
  await page.waitForTimeout(100);
 }
 throw Error('Stone visit did not complete');
}
try{
 await createPage(true);const before=await hero();assert.equal(before.level,10);assert.equal(before.experience,15000);
 const dialogs=await visit(),after=await hero();assert.equal(after.experience,17185);assert(JSON.stringify(dialogs).includes('2185'),'Final XP must be displayed');
 report.cases.push({name:'enabledVisit',before,after,dialogs});
 fs.writeFileSync(out+'/progress-report.json',JSON.stringify(report,null,2));
 const save=await readCompletedNativeSave(page,cmd);fs.writeFileSync(out+'/after-first-stone.vsgm1',save);report.savedSha256=digest(save);await page.close();
 await createPage(false,save);const reloaded=await hero();assert.equal(reloaded.experience,17185);
 const secondDialogs=await visit(),second=await hero();assert.equal(second.experience,19370);assert(JSON.stringify(secondDialogs).includes('2185'));
 report.cases.push({name:'savedChoiceSurvivesConfigDisabled',before:reloaded,after:second,dialogs:secondDialogs});fs.writeFileSync(out+'/progress-report.json',JSON.stringify(report,null,2));await page.close();
 await createPage(false);const controlBefore=await hero(),controlDialogs=await visit(),controlAfter=await hero();assert.equal(controlAfter.experience-controlBefore.experience,1150);
 report.cases.push({name:'disabledControl',before:controlBefore,after:controlAfter,dialogs:controlDialogs});
 await page.close();await createPage(true,undefined,{specialist:true});
 const specialistBefore=await hero(),specialistDialogs=await visit(),specialistAfter=await hero();assert.equal(specialistBefore.experience,15000);assert.equal(specialistAfter.experience,17327);assert(JSON.stringify(specialistDialogs).includes('2327'));
 report.cases.push({name:'learningSpecialistIgnoresUnrelatedExperienceBoost',before:specialistBefore,after:specialistAfter,dialogs:specialistDialogs});
 await page.close();await createPage(true);
 await cmd(55);await wait(()=>goonkMobileState.mode==='hero');await cmd(63);await wait(()=>goonkMobileState.mode==='map');
 const rect=(await state()).rect,css=await page.evaluate(()=>{Module._vcmiMobileEnable(2);const c=Module.canvas,s=c.style.cssText;c.style.setProperty('visibility','visible','important');c.style.position='absolute';c.style.left='-9999px';c.tabIndex=0;c.focus();return s;});
 await page.waitForTimeout(200);await page.evaluate(rect=>Module._vcmiMobilePointer(rect.x+100,rect.y+rect.h-35,1),rect);await page.waitForTimeout(200);await page.evaluate(()=>Module.canvas.focus());
 await page.keyboard.type('/controlai blue',{delay:20});await page.waitForTimeout(200);await cmd(1);await page.waitForTimeout(700);
 await page.evaluate(css=>{Module.canvas.style.cssText=css;Module._vcmiMobileEnable(1);},css);await page.waitForTimeout(300);
 const red=(await state()).heroId;await cmd(3);await wait(red=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.heroId!==red,red);
 const aiState=await state();assert.equal(aiState.players.find(p=>p.color===1).human,false,'Server player must remain AI');
 const aiBefore=await hero(),aiDialogs=await visit(),aiAfter=await hero();assert.equal(aiBefore.experience,15000);assert.equal(aiAfter.experience,17185);assert(JSON.stringify(aiDialogs).includes('2185'));
 report.cases.push({name:'serverAiVisit',before:aiBefore,after:aiAfter,players:aiState.players,dialogs:aiDialogs});
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/result.json',JSON.stringify({...report,passed:true,errors},null,2));console.log('PASS ERA779 human2185, saved frozen choice2185, disabled1150, specialist2327 ignoringXPboost, serverAI2185');
}catch(error){fs.writeFileSync(out+'/failure-state.json',JSON.stringify(await state().catch(()=>null),null,2));await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{await browser.close();}
