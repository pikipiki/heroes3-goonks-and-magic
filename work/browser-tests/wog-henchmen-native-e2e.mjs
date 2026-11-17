import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';

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

function fixture({dead=false,inTown=false,enemyHero=false,santa=false,stackExperience=0,bannerInventory=false,henchmanType=null,henchmanBanner=-1,enemyCount=1,archangels=5,enemyType='core:peasant',bless=false,blockFixture=false,reserveHero=false}={}){
 return execFileSync('python3',['-c',String.raw`
import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1])
with zipfile.ZipFile('maps/000-Goonk.vmap') as archive: entries={n:archive.read(n) for n in archive.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':
  o['options'].update({'type':'core:christian','experience':0,'primarySkills':{'attack':0,'defence':0,'spellpower':1,'knowledge':10},'army':[{'type':'core:peasant','amount':100},{'type':'core:archangel','amount':5}],'artifacts':{'spellbook':'core:spellBook'}})
  o['options']['army'][1]['amount']=opts['archangels']
  if opts['bless']:o['options'].update({'spellBook':['preset','core:bless'],'secondarySkills':{}})
  if opts['bannerInventory']: o['options']['artifacts']['backpack']=['wake-of-gods.stackartifacts:warlordsBannerHealth']
  if opts['inTown']: o['y']=9
  if opts['dead']: o['options']['henchman']={'type':'core:peasant','experience':100,'stackExperience':0,'alive':False,'declined':False,'banner':-1}
  if opts['santa']: o['options']['henchman']={'type':'wake-of-gods.creatures:santaGremlin','experience':1000,'stackExperience':opts['stackExperience'],'alive':True,'declined':False,'banner':-1}
  if opts['henchmanType']: o['options']['henchman']={'type':opts['henchmanType'],'experience':0,'stackExperience':opts['stackExperience'],'alive':True,'declined':False,'banner':opts['henchmanBanner']}
  if opts['blockFixture']: o['options']['artifacts']={'misc1':'core:shacklesOfWar'}
if opts['reserveHero']:
 import copy
 reserve=copy.deepcopy(next(o for o in objects if o['instanceName']=='goonkHero'))
 reserve.update({'instanceName':'henchmenReserveHero','x':6})
 reserve['options']['type']='core:edric'
 objects.append(reserve)
if opts['enemyHero']:
 import copy
 enemy=copy.deepcopy(next(o for o in objects if o['instanceName']=='goonkHero'))
 enemy.update({'instanceName':'enemyHenchmanHero','x':10})
 enemy['options'].update({'type':'core:orrin','owner':'blue','army':[{'type':'core:peasant','amount':5},{'type':'core:archer','amount':1}]})
 if opts['blockFixture']:
  enemy['options'].pop('henchman',None)
  enemy['options'].update({'army':[{'type':'core:goblin','amount':1}],'primarySkills':{'attack':0,'defence':0,'spellpower':0,'knowledge':0},'secondarySkills':{},'artifacts':{}})
 objects.append(enemy)
else:
 objects.append({'type':'core:monster','subtype':opts['enemyType'],'instanceName':'henchmenTrainingGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts['enemyCount'],'character':'savage','neverFlees':True}})
entries['objects.json']=json.dumps(objects).encode()
header=json.loads(entries['header.json']);header['name']='000 - Henchmen native validation';entries['header.json']=json.dumps(header).encode()
for name in ['english.json','french.json']:
 text=json.loads(entries[name]);text['mapName']='000 - Henchmen native validation';entries[name]=json.dumps(text).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in entries.items():archive.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())
`,JSON.stringify({dead,inTown,enemyHero,santa,stackExperience,bannerInventory,henchmanType,henchmanBanner,enemyCount,archangels,enemyType,bless,blockFixture,reserveHero})]);
}

async function boot({save,enabled=true,originURL=origin,settings,difficulty,...options}={}){
 const classic=process.env.CASES==='classic';
 // The packaged site's policy whitelists production domains, not localhost.
 page=await browser.newPage({viewport:classic?{width:1024,height:768}:{width:844,height:390},hasTouch:true,bypassCSP:true});
 if(classic)await page.addInitScript(()=>window.addEventListener('goonk-state',event=>{window.goonkMobileState=event.detail;}));
 await silenceTestAudio(page);
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('console',message=>{fs.appendFileSync(path.join(output,'console.log'),message.text().slice(0,2000)+'\n');if(message.text().includes('Temporary game startup failed'))page._startupFailed=true;});
 await page.addInitScript(({enabled,settings,blockFixture})=>{
  sessionStorage.setItem('heroes-goonk.storage-failed','true');
  let module;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:value=>{
   module=value;let callMain;
   Object.defineProperty(value,'callMain',{configurable:true,set:fn=>{callMain=fn;},get:()=>function(...args){
    const file='/home/web_user/.local/share/vcmi/Mods/tum-era/mod.json';
    const manifest=JSON.parse(value.FS.readFile(file,{encoding:'utf8'}));
    manifest.settings??={};manifest.settings.modules??={};manifest.settings.modules.henchmen=enabled;
    if(blockFixture){
     const name='config/henchmen-block-private.json';manifest.creatures=[...(manifest.creatures||[]),name];
     const abilities={privateNoMorale:{type:'NO_MORALE'},privateNoLuck:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'}};
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/'+name,JSON.stringify({
      'core:peasant':{hitPoints:1000000,speed:20,abilities},
      'core:goblin':{hitPoints:1000000,speed:1,attack:0,defense:0,damage:{min:200,max:200},abilities}
     }));
     manifest.settings.modules.commanders=false;
    }
    value.FS.writeFile(file,JSON.stringify(manifest));
    if(settings){
     const directory='/home/web_user/.local/share/vcmi/Mods/tum-era/content/config';
     value.FS.mkdirTree(directory);value.FS.writeFile(directory+'/henchmen-settings.json',JSON.stringify({henchmen:{settings}}));
    }
    try{return callMain.apply(value,args);}catch(error){window.goonkEngineStartupError=String(error)+' root='+JSON.stringify(value.FS.readdir('/'))+' cwd='+value.FS.cwd();throw error;}
   }});
  }});
 },{enabled,settings,blockFixture:!!options.blockFixture});
 await page.goto(originURL+'/game.html?mobile='+(classic?'0':'1'));
 await wait(()=>{const classic=location.search.includes('mobile=0');if(classic)window.Module?._vcmiMobileEnable?.(2);return window.goonkEngineStartupError||(window.goonkMobileState?.mode==='menu'&&(classic||goonkSessionRecovery?.phase==='done'));},null,240000).catch(async error=>{console.error(await page.evaluate(()=>{let log='';try{log=Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'});}catch(e){log=String(e);}return{startup:String(window.goonkEngineStartupError),log};}));throw error;});
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
  if(classic)await command(21);
  else await page.locator('#mobile-map-select').selectOption(String(map.index),{force:true});
  await wait(()=>goonkMobileState.selectedMap==='000 - Henchmen native validation');
  if(difficulty!==undefined){await command(25,difficulty);await wait(value=>goonkMobileState.difficulty===value,difficulty);}
  if(classic)await command(22);
  else await page.locator('[data-ui=begin]').tap();
 }
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
}

async function sheet(){
 if(process.env.CASES==='classic')await command(55);
 else await page.locator('[data-ui=heroes]').tap();
 await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);
 return (await state()).heroWindow;
}
async function startBattle(dx=1){
 await command(6);await page.waitForTimeout(150);
 const target=await page.evaluate(dx=>{const view=goonkMobileState.mapOverview.view;return{x:view.x+view.w/2+32*dx,y:view.y+view.h/2};},dx);
 await page.evaluate(point=>Module._vcmiMobilePointer(point.x,point.y,1),target);
 await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');
 await command(15);await wait(()=>goonkMobileState.battleUnits?.some(unit=>unit.armySlot===-6));
}
async function resolve(){
 for(let tick=0;tick<400;tick++){
  const current=await state();
  if(current.mode==='map'&&!current.hasPath){
   // Hero/commander level-up windows may be queued just after the map frame.
   await page.waitForTimeout(350);
   if((await state()).mode==='map')return;
   continue;
  }
  if(current.mode==='battle'&&current.canAutoCombat&&!current.autoCombat)await command(44,1);
  else if(current.mode==='dialog'){
   if(current.dialogKind==='commander-level-up'){
    const choice=current.dialogPresentation?.choices?.find(choice=>choice.selectable&&Number.isInteger(choice.skillId));
    if(choice)await command(96,choice.skillId);
   }
   await command(1);
  }
  await page.waitForTimeout(100);
 }
 throw Error('Henchman battle did not finish');
}

try{
 if(process.env.CASES==='battlefield-ai-experience'){
  for(const [difficulty,stored,expected]of [[0,1000,1000],[2,1000,3000],[4,1000,5000],[4,40000,56000]]){
   const replay=difficulty===4&&stored===1000;
   await boot({henchmanType:'core:archer',stackExperience:stored,enemyHero:true,difficulty,reserveHero:replay});
   const before=await sheet();assert.equal(before.henchman.stackExperience,stored);
   await command(63);await wait(()=>goonkMobileState.mode==='map');await startBattle();
   const current=await state(),human=current.battleUnits.find(unit=>unit.armySlot===-6&&!unit.enemy),ai=current.battleUnits.find(unit=>unit.armySlot===-6&&unit.enemy);
   assert.equal(human?.key,'core:archer');assert.equal(ai?.key,'core:archer');
   assert.equal(human.experiencePerUnit,stored);assert.equal(ai.experiencePerUnit,expected);
   assert.equal(current.players.find(player=>player.color===1).human,false);
   fs.writeFileSync(path.join(output,`battlefield-ai-${difficulty}-${stored}.json`),JSON.stringify({difficulty,stored,expected,human,ai},null,2));
   report.scenarios.push(`battlefield-ai-experience-difficulty-${difficulty}-stored-${stored}-temporary-${expected}`);
   if(replay){
    await wait(()=>goonkMobileState.canRetreat);await command(38);
    for(let tick=0;tick<200;++tick){
     const s=await state();if(s.mode==='dialog')await command(1);
     if(s.mode==='map'&&s.turn&&s.autosaveAllowed)break;
     await page.waitForTimeout(100);
    }
    await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.autosaveAllowed);
    await command(4,0);await wait(()=>goonkMobileState.heroName==='Edric');
    const save=await readCompletedNativeSave(page,command,{tag:934});await page.close();
    await boot({save:[...save]});await command(4,0);await wait(()=>goonkMobileState.heroName==='Edric');
    await startBattle(4);
    const again=(await state()).battleUnits.find(unit=>unit.armySlot===-6&&unit.enemy);
    assert.equal(again?.experiencePerUnit,expected,'Battlefield multiplier must not compound in the saved companion');
    report.scenarios.push('ai-battlefield-experience-does-not-persist-or-compound-after-retreat-save-reload-and-second-battle');
   }
   await page.close();
  }
 }
 if(process.env.CASES==='banner-block'){
  const {runBannerBlock}=await import('./wog-henchmen-banner-block-cases.mjs');
  await runBannerBlock({boot,startBattle,state,command,wait,page:()=>page,report,output});
 }
 if(process.env.CASES==='module-save'){
  for(const enabled of [true,false]){
   await boot({enabled});let hero=await sheet();assert.equal(!!hero.henchman,enabled);
   if(enabled){await page.locator('[data-hero-tab=henchman]').tap();await page.locator('[data-henchman-slot="0"]').tap();await wait(()=>goonkMobileState.heroWindow?.henchman?.unit);}
   await command(63);await wait(()=>goonkMobileState.mode==='map');
   const save=await readCompletedNativeSave(page,command,{tag:enabled?931:932});await page.close();
   await boot({save:[...save],enabled:!enabled});hero=await sheet();assert.equal(!!hero.henchman,enabled);
   if(enabled)assert.equal(hero.henchman.unit?.key,'core:peasant');
   report.scenarios.push(enabled?'companion-enabled-choice-and-unit-survive-disabled-installation-default':'companion-disabled-choice-survives-enabled-installation-default');await page.close();
  }
  if(process.env.HENCH_LEGACY_ORIGIN){
   await boot({enabled:true,originURL:process.env.HENCH_LEGACY_ORIGIN});await sheet();
   await page.locator('[data-hero-tab=henchman]').tap();await page.locator('[data-henchman-slot="0"]').tap();
   await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:peasant');
   await command(63);await wait(()=>goonkMobileState.mode==='map');
   const save=await readCompletedNativeSave(page,command,{tag:933});await page.close();
   await boot({save:[...save],enabled:false});const hero=await sheet();assert.equal(hero.henchman?.unit?.key,'core:peasant');
   report.legacyProducerEngineSha256=sha(path.join(process.env.HENCH_LEGACY_ENGINE_DIR,'vcmiclient.wasm'));
   report.scenarios.push('legacy-companion-save-retains-unit-with-disabled-installation-default');await page.close();
  }
 }
 if(process.env.CASES==='banner-defense'){
  for(const style of [-1,6]){
   await boot({henchmanType:'core:archangel',henchmanBanner:style,enemyType:'core:stoneGolem',enemyCount:1000,archangels:1,bless:true});
   await startBattle();
   for(let step=0;step<20;++step){
    await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);
    const current=await state(),active=current.battleUnits.find(unit=>unit.stackId===current.activeStack);
    if(active?.armySlot===-6)break;
    await command(13);await page.waitForTimeout(150);
   }
   await command(14);await wait(()=>goonkMobileState.mode==='spellbook');await command(51,0);
   assert((await state()).spellbook.spells.some(spell=>spell.id===41&&spell.enabled));
   await command(49,41);await wait(()=>goonkMobileState.mode==='battle');
   let current=await state();const hench=current.battleUnits.find(unit=>unit.armySlot===-6);
   await command(14,3,hench.occupied[0]);
   await wait(()=>goonkMobileState.battleUnits?.some(unit=>unit.armySlot===-6&&unit.spellEffects?.some(effect=>effect.id===41)));
   await page.waitForTimeout(200);await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&!goonkMobileState.spellTargeting);
   current=await state();const actor=current.battleUnits.find(unit=>unit.armySlot===-6),target=current.battleUnits.find(unit=>unit.enemy);
   assert.equal(current.activeStack,actor.stackId);
   const health=unit=>(unit.count-1)*unit.maximumHealth+unit.currentHealth;
   const before=health(target),defence=style===6?Math.trunc(target.defense*0.75):target.defense;
   const factor=1+Math.min(4,Math.max(0,actor.attack-defence)*0.05);
   const expected=Math.trunc(actor.damageMax*factor);
   const lucky=Math.trunc(actor.damageMax*(factor+1));
   assert.equal(current.battleCells.find(cell=>cell.hex===target.occupied[0]).actionLabel,'Attack');
   await command(14,4,target.occupied[0]);
   await wait(({id,before})=>{const unit=goonkMobileState.battleUnits?.find(unit=>unit.stackId===id);return unit&&(unit.count-1)*unit.maximumHealth+unit.currentHealth<before;},{id:target.stackId,before});
   const after=(await state()).battleUnits.find(unit=>unit.stackId===target.stackId),damage=before-health(after);
   assert(damage===expected||(actor.luck>0&&damage===lucky),JSON.stringify({style,damage,expected,lucky,actor,target}));
   report.scenarios.push(`native-banner-defense-${style}-damage-${damage}`);await page.close();
  }
 }
 if(process.env.CASES==='classic'){
  await boot({bannerInventory:true});await sheet();
  const flag=async()=>{
   const previous=await state(),r=previous.rect;
   await page.evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),{x:r.x+635,y:r.y+40});
   await wait(token=>goonkMobileState.windowToken!==token,previous.windowToken);
  };
  const row=async index=>{
   const r=(await state()).rect;
   await page.evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),{x:r.x+140,y:r.y+163+25*index});
   await command(1);
  };
  await flag();const menuToken=(await state()).windowToken;
  await command(1);await wait(token=>goonkMobileState.windowToken!==token,menuToken);
  await command(1);await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:peasant');
  await command(62,19);await wait(()=>goonkMobileState.heroWindow?.picked);
  await flag();await row(4);
  await wait(()=>goonkMobileState.heroWindow?.henchman?.bannerStyle===4&&!goonkMobileState.heroWindow.picked);
  await flag();await page.screenshot({path:path.join(output,'classic-henchman-menu.png')});
  const currentToken=(await state()).windowToken;
  await row(1);await wait(token=>goonkMobileState.windowToken!==token,currentToken);
  await row(8);await wait(()=>goonkMobileState.heroWindow?.henchman?.bannerStyle===8);
  report.scenarios.push('classic-hero-flag-native-choice-held-drop-and-banner-style-menus');
  await page.close();
 }
 if(process.env.CASES==='held-banner'){
  await boot({dead:true,bannerInventory:true,settings:{reviveAnywhere:true}});
  let hero=await sheet();assert(!hero.henchman.alive);assert(!hero.henchman.canEquipBanner);
  await command(62,19);await wait(()=>goonkMobileState.heroWindow?.picked);
  hero=(await state()).heroWindow;assert(hero.henchman.canEquipHeldBanner);
  await page.locator('[data-hero-tab=henchman]').tap();
  assert(await page.locator('[data-henchman-action="3"]').isDisabled());
  await page.locator('[data-henchman-action="6"]').tap();
  await wait(()=>!goonkMobileState.heroWindow.picked&&goonkMobileState.heroWindow.henchman.bannerStyle===0);
  hero=(await state()).heroWindow;assert(!hero.henchman.alive);
  assert(!hero.backpack.some(slot=>slot.name));
  const revision=hero.henchman.revision;
  await command(112,hero.id,6,-1,-1,revision);await page.waitForTimeout(250);
  assert.equal((await state()).heroWindow.henchman.revision,revision);
  report.scenarios.push('held-banner-transfer-consumes-native-transition-artifact-and-permits-dead-companion');
  await page.close();
 }
 if(process.env.CASES==='banner-experience'){
  for(const [style,count,archangels]of [[-1,100,5],[5,100,5],[-1,30000,5000],[5,30000,5000]]){
   await boot({henchmanType:'core:peasant',henchmanBanner:style,enemyCount:count,archangels});
   const before=await sheet();assert.equal(before.henchman.stackExperience,0);
   await command(63);await wait(()=>goonkMobileState.mode==='map');await startBattle();await resolve();
   const after=await sheet();assert(after.henchman.alive);
   const gained=after.experience-before.experience;
   assert(gained>0);
   const cap=style===5?13125:8750;
   const requested=style===5?Math.trunc(gained*3/2):gained;
   assert.equal(after.henchman.stackExperience,Math.min(cap,requested));
   if(count===30000)assert(gained>cap,'The large-stack case must exercise the source battle cap');
   report.scenarios.push(`banner-experience-${style}-count-${count}`);await page.close();
  }
 }
 if(process.env.CASES==='banner-scalars'){
  for(const [style,expected]of [
   [-1,{maximumHealth:77,attack:4,defense:4,damageMin:4,damageMax:5,speed:4,remainingRetaliations:1}],
   [0,{maximumHealth:104,attack:4,defense:4,damageMin:4,damageMax:5,speed:4}],
   [1,{maximumHealth:77,attack:9,defense:4,damageMin:4,damageMax:5,speed:4}],
   [2,{maximumHealth:77,attack:4,defense:9,damageMin:4,damageMax:5,speed:4}],
   [3,{maximumHealth:77,attack:4,defense:4,damageMin:7,damageMax:8,speed:4}],
   [4,{maximumHealth:77,attack:4,defense:4,damageMin:4,damageMax:5,speed:6}],
   [8,{maximumHealth:77,attack:4,defense:4,damageMin:4,damageMax:5,speed:4,remainingRetaliations:3}]
  ]){
   await boot({henchmanType:'core:peasant',henchmanBanner:style,stackExperience:17500});
   const hero=await sheet();assert.equal(hero.henchman.bannerStyle,style);
   await command(63);await wait(()=>goonkMobileState.mode==='map');await startBattle();
   const actor=(await state()).battleUnits.find(unit=>unit.armySlot===-6);
   const army=(await state()).battleUnits.find(unit=>!unit.enemy&&unit.armySlot===0);
   // The lobby can award a random starting artifact. Observe its ordinary
   // peasant effects independently, then apply the source rank10 row values
   // to the post-hench baseline; this also verifies hero bonuses are retained.
   expected.maximumHealth=Math.trunc((army.maximumHealth+50)*(style===0?2:1.5)+(style===0?2.5:0.5));
   for(const stat of ['attack','defense','damageMin','damageMax'])expected[stat]+=army[stat]-1;
   expected.speed+=army.speed-3;
   for(const [stat,value]of Object.entries(expected))assert.equal(actor[stat],value,`banner${style} ${stat}`);
   assert.equal(actor.currentHealth,actor.maximumHealth,'Source scalar transform precedes initial health allocation');
   report.scenarios.push(`source-scalar-rank10-banner-${style}`);await page.close();
  }
 }
 if(process.env.CASES==='banners'){
  await boot({bannerInventory:true});let hero=await sheet();
  await page.locator('[data-hero-tab=henchman]').tap();
  await page.locator('[data-henchman-action="0"][data-henchman-slot="0"]').tap();
  await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:peasant');
  hero=(await state()).heroWindow;
  const inventory=()=>state().then(s=>s.heroWindow.backpack.filter(slot=>slot.name).length);
  const initialInventory=await inventory();assert(initialInventory>=1);
  assert.equal(hero.henchman.bannerStyle,-1);assert(hero.henchman.canEquipBanner);
  await page.locator('[data-henchman-action="3"]').tap();
  await wait(()=>goonkMobileState.heroWindow.henchman.bannerStyle===0);
  assert.equal(await inventory(),initialInventory-1);
  const touch=await page.context().newCDPSession(page);
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1024,height:768}]){
   await page.setViewportSize(viewport);const grid=page.locator('.hero-equipment-grid');await grid.evaluate(node=>{node.scrollTop=0;});
   const overflow=await grid.evaluate(node=>node.scrollHeight>node.clientHeight+20);
   if(overflow){
    const box=await grid.boundingBox();assert(box&&box.height>80);
    const x=box.x+Math.min(box.width/2,100),start=box.y+box.height-25,end=box.y+25;
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:start}]});
    for(let step=1;step<=6;++step){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:start+(end-start)*step/6}]});await page.waitForTimeout(40);}
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await wait(()=>document.querySelector('.hero-equipment-grid').scrollTop>20);
   }
  }
  await touch.detach();await page.setViewportSize({width:844,height:390});
  report.scenarios.push('companion-banner-panel-real-touch-scroll-phone-and-ipad-without-keyboard');
  for(let style=1;style<=8;style++){
   await page.locator(`[data-henchman-action="4"][data-henchman-slot="${style}"]`).tap();
   await wait(style=>goonkMobileState.heroWindow.henchman.bannerStyle===style,style);
  }
  hero=(await state()).heroWindow;
  await command(112,hero.id,4,9,-1,hero.henchman.revision);await page.waitForTimeout(250);
  assert.equal((await state()).heroWindow.henchman.bannerStyle,8);
  assert.equal((await state()).heroWindow.henchman.revision,hero.henchman.revision);
  await page.locator('[data-henchman-action="0"][data-henchman-slot="1"]').tap();
  await wait(()=>goonkMobileState.heroWindow.henchman.unit?.key==='core:archangel');
  assert.equal((await state()).heroWindow.henchman.bannerStyle,8);
  await page.locator('[data-henchman-action="5"]').tap();
  await wait(()=>goonkMobileState.heroWindow.henchman.bannerStyle===-1);
  assert.equal(await inventory(),initialInventory);
  hero=(await state()).heroWindow;
  await command(112,hero.id,5,-1,-1,hero.henchman.revision);await page.waitForTimeout(250);
  assert.equal(await inventory(),initialInventory);
  await page.locator('[data-henchman-action="3"]').tap();
  await wait(()=>goonkMobileState.heroWindow.henchman.bannerStyle===0);
  await page.locator('[data-henchman-action="1"]').tap();
  await wait(()=>!goonkMobileState.heroWindow.henchman.unit);
  assert.equal((await state()).heroWindow.henchman.bannerStyle,-1);assert.equal(await inventory(),initialInventory-1);
  report.scenarios.push('banner-inventory-all-nine-styles-replacement-return-dismissal-loss-and-forged-actions');
  await page.close();
  await boot({settings:{bannerFree:true}});hero=await sheet();
  const freeInitialInventory=await inventory();
  await page.locator('[data-hero-tab=henchman]').tap();
  await page.locator('[data-henchman-action="0"][data-henchman-slot="0"]').tap();
  await wait(()=>goonkMobileState.heroWindow.henchman.unit);
  assert.equal((await state()).heroWindow.henchman.bannerStyle,0);
  await page.locator('[data-henchman-action="5"]').tap();
  await wait(()=>goonkMobileState.heroWindow.henchman.bannerStyle===-1);
  await page.locator('[data-henchman-action="1"]').tap();
  await wait(()=>!goonkMobileState.heroWindow.henchman.unit);
  await page.locator('[data-henchman-action="0"][data-henchman-slot="0"]').tap();
  await wait(()=>goonkMobileState.heroWindow.henchman.unit);
  assert.equal((await state()).heroWindow.henchman.bannerStyle,-1);
  assert.equal(await inventory(),freeInitialInventory+1);
  report.scenarios.push('free-banner-is-granted-once-and-return-does-not-regenerate-it');
  await page.close();
 }
 if(!process.env.CASES||process.env.CASES==='core'){
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
 await wait(()=>goonkMobileState.canAct);
 await command(114,actor.stackId);await wait(()=>goonkMobileState.mode==='creature');
 await command(0);await wait(()=>goonkMobileState.mode==='battle');
 report.scenarios.push('companion-battle-inspection-keeps-its-native-command');
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
 const save=[...await readCompletedNativeSave(page,command,{tag:812})];
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
 await boot({santa:true});hero=await sheet();
 const santaLevel=hero.henchman.level;assert(santaLevel>1);
 await command(63);await wait(()=>goonkMobileState.mode==='map');await startBattle();
 await wait(()=>goonkMobileState.battleUnits?.some(unit=>unit.key==='core:gremlin'));
 const guardians=(await state()).battleUnits.filter(unit=>unit.key==='core:gremlin');
 assert(guardians.length>0&&guardians.every(unit=>unit.count===santaLevel),JSON.stringify({santaLevel,guardians}));
 report.scenarios.push('santa-companion-guardian-count-multiplied-by-companion-level');await page.close();
 if(process.env.HENCHMAN_LEGACY_ORIGIN){
  report.legacyEngineSha256=sha(path.join(process.env.HENCHMAN_LEGACY_ENGINE_DIR||'work/downloads/henchmen-native-engine','vcmiclient.wasm'));
  assert.notEqual(report.legacyEngineSha256,report.engineSha256);
  await boot({originURL:process.env.HENCHMAN_LEGACY_ORIGIN});await sheet();
  await page.locator('[data-hero-tab=henchman]').tap();await page.locator('[data-henchman-slot="1"]').tap();
  await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:archangel');
  const oldCompanion=(await state()).heroWindow.henchman;
  await command(63);await wait(()=>goonkMobileState.mode==='map');
  const oldSave=[...await readCompletedNativeSave(page,command,{tag:813})];
  await page.close();await boot({save:oldSave});hero=await sheet();
  assert.equal(hero.henchman.unit.key,oldCompanion.unit.key);assert.equal(hero.henchman.experience,oldCompanion.experience);assert(hero.henchman.alive);
  report.scenarios.push('previous-engine-save-restores-companion');await page.close();
 }
 await boot({enabled:false});hero=await sheet();assert(!hero.henchman);assert.equal(await page.locator('[data-hero-tab=henchman]').count(),0);
 report.scenarios.push('disabled-profile-baseline');
 await page.close();
 }
 if(!process.env.CASES||process.env.CASES==='settings'){
 await boot({santa:true,stackExperience:1000000,settings:{moreSantaGuards:false,altExpPerLv:false,battleExpLossPct:50,returnToArmy:false,stackExpEnabled:false}});
 let hero=await sheet();const savedLevel=hero.henchman.level;
 assert(savedLevel>1);assert.equal(hero.henchman.rank,0);assert.equal(hero.henchman.returnToArmy,false);
 await page.locator('[data-hero-tab=henchman]').tap();assert.match(await page.locator('.henchman-sheet').innerText(),/50\s*%/);
 await command(63);await wait(()=>goonkMobileState.mode==='map');
 const save=[...await readCompletedNativeSave(page,command,{tag:814})];await page.close();
 await boot({save,settings:{moreSantaGuards:true,altExpPerLv:true,battleExpLossPct:0,returnToArmy:true,stackExpEnabled:true}});
 hero=await sheet();assert.equal(hero.henchman.level,savedLevel);assert.equal(hero.henchman.returnToArmy,false);
 report.scenarios.push('companion-settings-frozen-in-native-save');
 await command(63);await wait(()=>goonkMobileState.mode==='map');await startBattle();
 await wait(()=>goonkMobileState.battleUnits?.some(unit=>unit.key==='core:gremlin'));
 assert((await state()).battleUnits.filter(unit=>unit.key==='core:gremlin').every(unit=>unit.count===1));
 report.scenarios.push('santa-guard-enhancement-can-be-disabled');
 await resolve();hero=await sheet();const experience=hero.henchman.experience;
 assert.equal(hero.henchman.rank,0);await page.locator('[data-hero-tab=henchman]').tap();
 await page.locator('[data-henchman-slot="1"]').tap();await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:archangel');
 hero=(await state()).heroWindow;
 assert.equal(hero.henchman.experience,experience-Math.trunc(experience*50/100));
 assert(!hero.henchman.candidates.some(unit=>unit.key==='wake-of-gods.creatures:santaGremlin'));
 report.scenarios.push('replacement-loss-and-no-return-options');await page.close();
 await boot({dead:true,settings:{reviveAnywhere:true}});hero=await sheet();assert(hero.henchman.canResurrect);
 const gold=(await state()).resources[6],cost=hero.henchman.resurrectionCost;
 await page.locator('[data-hero-tab=henchman]').tap();await page.locator('[data-henchman-action="2"]').tap();
 await wait(()=>goonkMobileState.heroWindow?.henchman?.alive);assert.equal((await state()).resources[6],gold-cost);
 report.scenarios.push('revive-anywhere-option-pays-outside-town');await page.close();
 await boot({dead:true,settings:{reviveAnywhere:false}});hero=await sheet();assert(!hero.henchman.canResurrect);
 const before=(await state()).resources[6];await command(112,hero.id,2,-1,-1,hero.henchman.revision);await page.waitForTimeout(300);
 assert(!(await state()).heroWindow.henchman.alive);assert.equal((await state()).resources[6],before);
 report.scenarios.push('town-only-resurrection-rejects-forged-request');await page.close();
 }
 assert.deepEqual(report.errors,[]);
 fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,...report},null,2));
}catch(error){
 if(page){await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(output,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));const log=await page.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'});}catch{return '';}}).catch(()=> '');fs.writeFileSync(path.join(output,'native-failure.log'),log);}
 console.error(error);process.exitCode=1;
}finally{await browser.close();}
