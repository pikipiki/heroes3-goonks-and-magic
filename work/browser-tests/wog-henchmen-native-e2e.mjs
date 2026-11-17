import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {silenceTestAudio} from './silent-audio.mjs';

const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8797';
const output=process.env.REVIEW_OUTPUT||'/private/tmp/goonk-henchmen-native';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const engineDirectory=process.env.GOONK_ENGINE_DIR||'work/downloads/henchmen-native-engine';
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={scope:'native-core-only',completeRules:false,engineSha256:sha(path.join(engineDirectory,'vcmiclient.wasm')),scenarios:[],errors:[]};
let page;
const wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
const state=()=>page.evaluate(()=>goonkMobileState);
const command=(...values)=>page.evaluate(values=>Module._vcmiMobileCommand(...values,...Array(6-values.length).fill(0)),values);

function fixture({dead=false,inTown=false,enemyHero=false}={}){
 return execFileSync('python3',['-c',String.raw`
import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1])
with zipfile.ZipFile('maps/000-Goonk.vmap') as archive: entries={n:archive.read(n) for n in archive.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':
  o['options'].update({'type':'core:christian','experience':0,'primarySkills':{'attack':0,'defence':0,'spellpower':1,'knowledge':10},'army':[{'type':'core:peasant','amount':100},{'type':'core:archangel','amount':5}],'artifacts':{'spellbook':'core:spellBook'}})
  if opts['inTown']: o['y']=9
  if opts['dead']: o['options']['henchman']={'type':'core:peasant','experience':100,'stackExperience':0,'alive':False,'declined':False,'banner':-1}
if opts['enemyHero']:
 import copy
 enemy=copy.deepcopy(next(o for o in objects if o['instanceName']=='goonkHero'))
 enemy.update({'instanceName':'enemyHenchmanHero','x':10})
 enemy['options'].update({'type':'core:orrin','owner':'blue','army':[{'type':'core:peasant','amount':5},{'type':'core:archer','amount':1}]})
 objects.append(enemy)
else:
 objects.append({'type':'core:monster','subtype':'core:peasant','instanceName':'henchmenTrainingGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':1,'character':'savage','neverFlees':True}})
entries['objects.json']=json.dumps(objects).encode()
header=json.loads(entries['header.json']);header['name']='000 - Henchmen native validation';entries['header.json']=json.dumps(header).encode()
for name in ['english.json','french.json']:
 text=json.loads(entries[name]);text['mapName']='000 - Henchmen native validation';entries[name]=json.dumps(text).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in entries.items():archive.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())
`,JSON.stringify({dead,inTown,enemyHero})]);
}

async function boot({save,enabled=true,...options}={}){
 // The packaged site's policy whitelists production domains, not localhost.
 page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});
 await silenceTestAudio(page);
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('console',message=>{fs.appendFileSync(path.join(output,'console.log'),message.text().slice(0,2000)+'\n');if(message.text().includes('Temporary game startup failed'))page._startupFailed=true;});
 await page.addInitScript(enabled=>{
  sessionStorage.setItem('heroes-goonk.storage-failed','true');
  let module;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:value=>{
   module=value;let callMain;
   Object.defineProperty(value,'callMain',{configurable:true,set:fn=>{callMain=fn;},get:()=>function(...args){
    const file='/home/web_user/.local/share/vcmi/Mods/tum-era/mod.json';
    const manifest=JSON.parse(value.FS.readFile(file,{encoding:'utf8'}));
    manifest.settings??={};manifest.settings.modules??={};manifest.settings.modules.henchmen=enabled;
    value.FS.writeFile(file,JSON.stringify(manifest));
    try{return callMain.apply(value,args);}catch(error){window.goonkEngineStartupError=String(error)+' root='+JSON.stringify(value.FS.readdir('/'))+' cwd='+value.FS.cwd();throw error;}
   }});
  }});
 },enabled);
 await page.goto(origin+'/game.html?mobile=1');
 await wait(()=>window.goonkEngineStartupError||(window.goonkMobileState?.mode==='menu'&&goonkSessionRecovery?.phase==='done'),null,240000).catch(async error=>{console.error(await page.evaluate(()=>{let log='';try{log=Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'});}catch(e){log=String(e);}return{startup:String(window.goonkEngineStartupError),log};}));throw error;});
 const startup=await page.evaluate(()=>{if(!window.goonkEngineStartupError)return null;let log='';try{log=Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'});}catch{}return {error:String(goonkEngineStartupError),log};});
 if(startup)throw Error(JSON.stringify(startup));
 if(save){
  await page.evaluate(bytes=>{Module.FS.mkdirTree('/home/web_user/.local/share/vcmi/Saves');Module.FS.writeFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',new Uint8Array(bytes));},save);
  await command(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);
  const selection=(await state()).maps.find(row=>/Goonk-auto/i.test(row.name+' '+row.file));assert(selection);
  await command(27,selection.index);await command(22);
 }else{
  await page.evaluate(bytes=>{for(const name of ['001-Goonks.vmap','003-Goonks-WoG.vmap']){
   const file='/home/web_user/.local/share/vcmi/Maps/'+name;
   try{Module.FS.stat(file);Module.FS.writeFile(file,new Uint8Array(bytes));}catch{}
  }},[...fixture(options)]);
  await command(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);
  await wait(()=>goonkMobileState.maps?.some(row=>row.name==='000 - Henchmen native validation'));
  const map=(await state()).maps.find(row=>row.name==='000 - Henchmen native validation');
  await page.locator('#mobile-map-select').selectOption(String(map.index),{force:true});
  await wait(()=>goonkMobileState.selectedMap==='000 - Henchmen native validation');
  await page.locator('[data-ui=begin]').tap();
 }
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
}

async function sheet(){
 await page.locator('[data-ui=heroes]').tap();
 await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);
 return (await state()).heroWindow;
}
async function startBattle(){
 await command(6);await page.waitForTimeout(150);
 const target=await page.evaluate(()=>{const view=goonkMobileState.mapOverview.view;return{x:view.x+view.w/2+32,y:view.y+view.h/2};});
 await page.evaluate(point=>Module._vcmiMobilePointer(point.x,point.y,1),target);
 await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');
 await command(15);await wait(()=>goonkMobileState.battleUnits?.some(unit=>unit.armySlot===-6));
}
async function resolve(){
 for(let tick=0;tick<400;tick++){
  const current=await state();
  if(current.mode==='map'&&!current.hasPath)return;
  if(current.mode==='battle'&&current.canAutoCombat&&!current.autoCombat)await command(44,1);
  else if(current.mode==='dialog')await command(1);
  await page.waitForTimeout(100);
 }
 throw Error('Henchman battle did not finish');
}

try{
 await boot();
 let hero=await sheet();assert(hero.henchman&&!hero.henchman.unit);
 await page.locator('[data-hero-tab=henchman]').tap();
 await page.locator('[data-henchman-slot="0"]').tap();
 await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:peasant');
 hero=(await state()).heroWindow;assert.equal(hero.henchman.level,1);assert.equal(hero.henchman.unit.health,51);
 const heroId=hero.id;
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1024,height:768}]){
  await page.setViewportSize(viewport);
  const layout=await page.locator('.hero-equipment-page').evaluate(panel=>({
   width:panel.clientWidth,scrollWidth:panel.scrollWidth,
   scroll:getComputedStyle(panel.querySelector('.hero-equipment-grid')).overflowY,
   closes:panel.querySelectorAll('[data-hero-close]').length,
   small:[...panel.querySelectorAll('.henchman-sheet button')].some(button=>button.getBoundingClientRect().height<44)
  }));
  assert(layout.scrollWidth<=layout.width+1&&!layout.small&&layout.closes===1,JSON.stringify(layout));
  assert(['auto','scroll'].includes(layout.scroll));
 }
 await page.screenshot({path:path.join(output,'henchman-sheet.png')});
 report.scenarios.push('selected-from-army-and-mobile-layout');
 await command(63);await wait(()=>goonkMobileState.mode==='map');
 await startBattle();
 const actor=(await state()).battleUnits.find(unit=>unit.armySlot===-6);
 assert.equal(actor.count,1);assert(actor.maximumHealth>=51);
 await resolve();hero=await sheet();
 assert(hero.henchman.alive&&hero.henchman.experience>=6);
 report.scenarios.push('independent-battle-actor-and-earned-experience');
 await page.locator('[data-hero-tab=henchman]').tap();
 const previousExperience=hero.henchman.experience;
 await page.locator('[data-henchman-slot="1"]').tap();
 await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:archangel');
 hero=(await state()).heroWindow;assert.equal(hero.henchman.experience,previousExperience);
 assert.equal(hero.id,heroId);
 report.scenarios.push('replacement-preserves-companion-experience');
 await command(63);await wait(()=>goonkMobileState.mode==='map');
 const before=await page.evaluate(()=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').mtime.getTime();}catch{return 0;}});
 await command(34,812);
 await wait(previous=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').mtime.getTime()>previous;}catch{return false;}},before);
 const save=await page.evaluate(()=>[...Module.FS.readFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1')]);
 await page.close();await boot({save});hero=await sheet();
 assert.equal(hero.henchman.unit.key,'core:archangel');assert.equal(hero.henchman.experience,previousExperience);assert(hero.henchman.alive);
 report.scenarios.push('native-save-reload');await page.close();
 await boot({dead:true,inTown:true});hero=await sheet();
 assert(hero.henchman.unit&&!hero.henchman.alive&&hero.henchman.canResurrect);
 await page.locator('[data-hero-tab=henchman]').tap();
 const beforeRevival=hero.henchman.experience;
 const goldBefore=(await state()).resources[6],revivalCost=hero.henchman.resurrectionCost;
 await page.locator('[data-henchman-action="2"]').tap();
 await wait(()=>goonkMobileState.heroWindow?.henchman?.alive);
 hero=(await state()).heroWindow;assert.equal(hero.henchman.experience,beforeRevival);
 assert.equal((await state()).resources[6],goldBefore-revivalCost);
 report.scenarios.push('dead-companion-resurrected-in-owned-town');await page.close();
 await boot({enemyHero:true});await startBattle();
 const aiCompanion=(await state()).battleUnits.find(unit=>unit.armySlot===-6&&unit.enemy);
 assert(aiCompanion&&aiCompanion.key==='core:archer'&&aiCompanion.count===1);
 report.scenarios.push('ai-selects-shooter-as-independent-companion');await page.close();
 await boot({enabled:false});hero=await sheet();assert(!hero.henchman);assert.equal(await page.locator('[data-hero-tab=henchman]').count(),0);
 report.scenarios.push('disabled-profile-baseline');
 assert.deepEqual(report.errors,[]);
 fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,...report},null,2));
}catch(error){
 if(page){await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(output,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));const log=await page.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'});}catch{return '';}}).catch(()=> '');fs.writeFileSync(path.join(output,'native-failure.log'),log);}
 console.error(error);process.exitCode=1;
}finally{await browser.close();}
