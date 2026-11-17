import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
import {readJsonc} from '../../scripts/era-bridge/objects/production-resolvers.mjs';

const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8798';
const output=process.env.REVIEW_OUTPUT||'/private/tmp/goonk-mithril-native';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const engineDirectory=process.env.GOONK_ENGINE_DIR||'work/downloads/mithril-native-engine';
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={scope:'mithril-sites',completeRules:false,engineSha256:sha(path.join(engineDirectory,'vcmiclient.wasm')),scenarios:[],errors:[]};
const testDifficulty=readJsonc('work/vcmi-wasm/config/difficulty.json');
const testMarkets=readJsonc('work/vcmi-wasm/config/objects/markets.json');
const testShrines=readJsonc('work/vcmi-wasm/config/objects/shrine.json');
const testModdables=readJsonc('work/vcmi-wasm/config/objects/moddables.json');
const testHuts=readJsonc('work/vcmi-wasm/config/objects/witchHut.json');
for(const group of Object.values(testDifficulty))for(const rule of Object.values(group))if(rule.resources)rule.resources.mithril=100;
let page;
const wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
const state=()=>page.evaluate(()=>goonkMobileState);
const command=(...values)=>page.evaluate(values=>Module._vcmiMobileCommand(...values,...Array(6-values.length).fill(0)),values);

function fixture({reroll=null,siege=false,changingMine=false,plainsFight=false,plainsBlock='',universityTwo=false,capitolFixture=false,bluePlainsOwner=false,capitolCapture=false,movementWater=false}={}){
 return execFileSync('python3',['-c',String.raw`
import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1])
with zipfile.ZipFile('maps/000-Goonk.vmap') as archive: entries={n:archive.read(n) for n in archive.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':
  o['options'].update({'type':'core:christian','experience':0,'army':[{'type':'core:archangel','amount':10}],'artifacts':{'spellbook':'core:spellBook'}})
  if opts['reroll']=='university': o['options']['secondarySkills']={'core:wisdom':'basic',**({'core:airMagic':'basic'} if opts['universityTwo'] else {})}
  if opts['reroll']=='hut-rng': o['options']['secondarySkills']={'core:armorer':'basic'}
  if opts['plainsFight']:o['options'].update({'primarySkills':{'attack':0,'defence':0,'spellpower':1,'knowledge':10},'secondarySkills':{'core:leadership':'basic'},'spellBook':['core:bless','core:bloodlust','core:haste','core:slow']})
def site(name,kind,subtype,x,y,owner=None):
 o={'type':'core:'+kind,'subtype':'core:'+subtype,'instanceName':name,'x':x,'y':y,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}}
 if owner:o['options']['owner']=owner
 objects.append(o)
if opts['capitolFixture']:
 import copy
 original=next(o for o in objects if o['instanceName']=='goonkTown')
 original['options']['buildings']['allOf']+=['goonk:townHall','goonk:cityHall','goonk:capitol']
 second=copy.deepcopy(next(o for o in objects if o['instanceName']=='enemyTown'))
 second.update({'instanceName':'secondCapitolTown','x':15,'y':15})
 second['options'].update({'name':'Second Capitol','owner':'red','army':[]})
 second['options']['buildings']={'allOf':['core:'+b for b in ['villageHall','townHall','cityHall','tavern','fort','citadel','castle','mageGuild1','blacksmith','marketplace']]}
 if opts['capitolCapture']:
  second.update({'x':13,'y':12})
  second['options']['owner']='blue'
  second['options']['buildings']['allOf'].append('core:capitol')
 objects.append(second)
site('mithrilGold','mine','goldMine',12,11,'red')
site('mithrilOre','mine','orePit',13,11,'red')
site('mithrilEnemy','mine','goldMine',14,11,'blue')
site('mithrilDwelling','creatureGeneratorCommon','guardhouse',12,12,'red')
if opts['reroll'] in ['shrine','rng']:
 site('mithrilShrine','shrineOfMagicLevel1','shrineOfMagicLevel1',10,11)
 objects[-1]['options']['rewardable']={'variables':{'preset':{'spell@gainedSpell':'core:bless'}}}
elif opts['reroll'] in ['hut','hut-rng']:
 site('mithrilHut','witchHut','witchHut',10,11)
 objects[-1]['options']['rewardable']={'variables':{'preset':{'secondarySkill@gainedSkill':'core:offence'}}}
elif opts['reroll']=='university': site('mithrilAdvancedUniversity','university','object',9,11)
elif opts['reroll']=='payout': site('mithrilPayout','waterWheel','waterWheel',9,11)
elif opts['reroll']=='conflux': site('mithrilConflux','creatureGeneratorSpecial','elementalConflux',9,11,'red')
else: site('mithrilMill','windmill','windmill',10,11)
site('mithrilWheel','waterWheel','waterWheel',8,11)
site('mithrilUniversity','university','object',8,12)
site('mithrilShipyard','shipyard','object',13,13,'red')
site('mithrilPortal','monolithOneWayEntrance','monolith1',8,10)
site('mithrilPortalExit','monolithOneWayExit','monolith1',16,16)
if opts['changingMine']:site('mithrilChanging','mine','crystalCavern',15,11,'red')
if opts['plainsFight']:
 objects.append({'type':'core:monster','subtype':'core:peasant','instanceName':'plainsTrainingGuard','x':9,'y':11,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':1,'character':'savage','neverFlees':True}})
 if opts['plainsBlock']=='entrance':site('plainsBlockingEntrance','waterWheel','waterWheel',10,12)
if opts['siege']:
 import copy
 objects=objects[:3]
 hero=next(o for o in objects if o['instanceName']=='goonkHero')
 hero['y']=9
 hero['options'].update({'army':[{'type':'core:pikeman','amount':40},{'type':'core:troglodyte','amount':40},{'type':'core:nomad','amount':40}], 'primarySkills':{'attack':0,'defence':0,'spellpower':1,'knowledge':10},'secondarySkills':{'core:leadership':'basic','core:luck':'basic'},'spellBook':['core:bless','core:bloodlust','core:haste','core:slow','core:stoneSkin','core:fireball']})
 enemy=copy.deepcopy(hero)
 enemy.update({'instanceName':'mithrilSiegeAttacker','y':10})
 enemy['options'].update({'type':'core:orrin','owner':'blue','army':[{'type':'core:stoneGolem','amount':500}], 'secondarySkills':{},'artifacts':{},'spellBook':[]})
 objects.append(enemy)
if opts['bluePlainsOwner']:
 import copy
 blue=copy.deepcopy(next(o for o in objects if o['instanceName']=='goonkHero'))
 blue.update({'instanceName':'bluePlainsHero','x':10,'y':10})
 blue['options'].update({'type':'core:orrin','owner':'blue','army':[{'type':'core:peasant','amount':1}],'patrolRadius':0,'artifacts':{},'spellBook':[]})
 objects.append(blue)
if opts['plainsFight'] and opts['plainsBlock']=='underground':
 for o in objects:
  if o['instanceName'] in ['goonkHero','plainsTrainingGuard']:o['l']=1
if opts['movementWater']:objects=[o for o in objects if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
if opts['capitolCapture']:objects=[o for o in objects if o['instanceName'] in ['goonkHero','goonkTown','enemyTown','secondCapitolTown']]
entries['objects.json']=json.dumps(objects).encode()
terrain=json.loads(entries['surface_terrain.json'])
for y,row in enumerate(terrain):
 for x in range(len(row)):
  if 20<=x<=22 or 20<=y<=22: row[x]='rc0_'
if opts['movementWater']:
 for y in range(10,18):
  for x in range(5,18):terrain[y][x]='wt0_'
if opts['plainsBlock']=='rock':terrain[12][10]='rc0_'
if opts['plainsBlock']=='water':terrain[12][10]='wt0_'
if opts['plainsBlock']=='underground':entries['underground_terrain.json']=json.dumps(terrain).encode()
entries['surface_terrain.json']=json.dumps(terrain).encode()
header=json.loads(entries['header.json']);header['name']='000 - Mithril native validation'
if opts['reroll']=='rng':header['allowedSpells']={'anyOf':['core:bless','core:haste','core:slow']}
if opts['reroll']=='hut-rng':header['allowedAbilities']={'noneOf':['core:eagleEye']}
if opts['plainsBlock']=='underground':header['mapLevels']['underground']={'width':36,'height':36,'index':1,'layer':'core:underground'}
entries['header.json']=json.dumps(header).encode()
for name in ['english.json','french.json']:
 text=json.loads(entries[name]);text['mapName']='000 - Mithril native validation';entries[name]=json.dumps(text).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in entries.items():archive.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())
`,JSON.stringify({reroll,siege,changingMine,plainsFight,plainsBlock,universityTwo,capitolFixture,bluePlainsOwner,capitolCapture,movementWater})]);
}

async function boot({save,enabled=true,henchmen=false,funds=100,preserveRewards=false,weeklyMines=false,dailyPlains=false,multipleCapitols=false,doubleMovement=false,goldFunds=null,...options}={}){
 page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
 await silenceTestAudio(page);
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('console',message=>{fs.appendFileSync(path.join(output,'console.log'),message.text().slice(0,2000)+'\n');if(message.text().includes('Temporary game startup failed'))page._startupFailed=true;});
 const difficulty=structuredClone(testDifficulty);
 for(const group of Object.values(difficulty))for(const rule of Object.values(group))if(rule.resources){rule.resources.mithril=funds;if(goldFunds!==null)rule.resources.gold=goldFunds;}
 const markets=options.reroll==='university'?structuredClone(testMarkets):null;
 if(markets)markets.university.types.object.offer={wisdom:1,airMagic:1,earthMagic:1,fireMagic:1};
 const shrines=preserveRewards||options.reroll==='rng'?structuredClone(testShrines):null;
 if(preserveRewards)shrines.shrineOfMagicLevel1.types.shrineOfMagicLevel1.rewards[0].resources={gold:{min:1001,max:9999}};
 if(options.reroll==='rng')shrines.shrineOfMagicLevel1.types.shrineOfMagicLevel1.variables.spell.gainedSpell={anyOf:['bless']};
 const huts=options.reroll==='hut-rng'?structuredClone(testHuts):null;
 if(huts)huts.witchHut.types.witchHut.variables.secondarySkill.gainedSkill={anyOf:['offence']};
 const moddables=options.changingMine?structuredClone(testModdables):null;
 if(moddables)moddables.mine.types.crystalCavern.defaultQuantity=123;
 await page.addInitScript(({enabled,henchmen,difficulty,markets,shrines,huts,moddables,weeklyMines,dailyPlains,multipleCapitols,doubleMovement})=>{
  sessionStorage.setItem('heroes-goonk.storage-failed','true');
  let module;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:value=>{
   module=value;let callMain;
   Object.defineProperty(value,'callMain',{configurable:true,set:fn=>{callMain=fn;},get:()=>function(...args){
    const file='/home/web_user/.local/share/vcmi/Mods/tum-era/mod.json';
    const manifest=JSON.parse(value.FS.readFile(file,{encoding:'utf8'}));
    manifest.settings??={};manifest.settings.modules??={};manifest.settings.modules.mithrilEnhancements=enabled;
    manifest.settings.modules.henchmen=henchmen;
    value.FS.writeFile('/config/difficulty.json',JSON.stringify(difficulty));
    if(markets)value.FS.writeFile('/config/objects/markets.json',JSON.stringify(markets));
    if(shrines)value.FS.writeFile('/config/objects/shrine.json',JSON.stringify(shrines));
    if(huts)value.FS.writeFile('/config/objects/witchHut.json',JSON.stringify(huts));
    if(moddables)value.FS.writeFile('/config/objects/moddables.json',JSON.stringify(moddables));
    const directory='/home/web_user/.local/share/vcmi/Mods/tum-era/content/config';
    value.FS.mkdirTree(directory);value.FS.writeFile(directory+'/wog-map-rules.json',JSON.stringify({mapRules:{114:dailyPlains,121:doubleMovement,122:weeklyMines,124:multipleCapitols}}));
    value.FS.writeFile(file,JSON.stringify(manifest));
    try{return callMain.apply(value,args);}catch(error){window.goonkEngineStartupError=String(error)+' root='+JSON.stringify(value.FS.readdir('/'))+' cwd='+value.FS.cwd();throw error;}
   }});
  }});
 },{enabled,henchmen,difficulty,markets,shrines,huts,moddables,weeklyMines,dailyPlains,multipleCapitols,doubleMovement});
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
  await wait(()=>goonkMobileState.maps?.some(row=>row.name==='000 - Mithril native validation'));
  const map=(await state()).maps.find(row=>row.name==='000 - Mithril native validation');
  await page.locator('#mobile-map-select').selectOption(String(map.index),{force:true});
  await wait(()=>goonkMobileState.selectedMap==='000 - Mithril native validation');
  await page.locator('[data-ui=begin]').tap();
 }
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
}

async function panel(){
 if(await page.locator('.mithril-panel').isHidden())await page.locator('button[data-mithril-open]').tap();
 await wait(()=>goonkMobileState.mithril);
 return (await state()).mithril;
}
async function buy(offer){
 const before=await panel();
 await page.locator(`[data-mithril-buy="${offer.id}"][data-mithril-choice="${offer.choice||0}"]`).tap();
 if(offer.kind===6){
  await wait(amount=>goonkMobileState.resources[7]===amount,before.amount-offer.cost);
  await page.locator('.mithril-panel').waitFor({state:'hidden'});return;
 }
 await wait(revision=>goonkMobileState.mithril?.revision>revision,before.revision);
 assert.equal((await state()).mithril.amount,before.amount-offer.cost);
}
async function nextDay(){
 if(await page.locator('.mithril-panel').isVisible())await page.locator('[data-mithril-close]').tap();
 const old=(await state()).day;await command(3);
 for(let i=0;i<600;++i){
  const current=await state();
  if(current.mode==='map'&&current.turn&&current.day>old)return;
  if(current.mode==='dialog')await command(1);
  await page.waitForTimeout(100);
 }
 throw Error('Next day did not start');
}
async function walk(dx,dy=0){
 await command(6);await page.waitForTimeout(150);
 const point=await page.evaluate(({dx,dy})=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+32*dx,y:v.y+v.h/2+32*dy};},{dx,dy});
 await page.evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);
 for(let i=0;i<400;++i){const s=await state();if(s.mode==='recruit')return s;if(s.mode==='dialog'){await command(1);await wait(token=>goonkMobileState.windowToken!==token||goonkMobileState.mode!=='dialog',s.windowToken);}else if(i>3&&s.mode==='map'&&!s.hasPath&&!s.heroMoving)return s;await page.waitForTimeout(100);}
 throw Error('Site visit did not finish');
}
async function recruitmentStock(){
 await wait(()=>goonkMobileState.mode==='recruit'&&goonkMobileState.previewUnits?.length);
 const choices=[...new Map((await state()).previewUnits.map(row=>[row.key,row])).values()],stock={};
 for(const unit of choices){
  const p=unit.preview;await page.evaluate(p=>Module._vcmiMobilePointer(p.x+p.w/2,p.y+p.h/2,1),p);
  await wait(key=>goonkMobileState.recruitUnit?.key===key,unit.key);stock[unit.key]=(await state()).recruitUnit.count;
 }
 return stock;
}
try{
 if(process.env.CASES==='double-movement'){
  const enabled=!process.env.MOVEMENT_DISABLED,water=!!process.env.MOVEMENT_WATER;
  await boot({enabled:false,doubleMovement:enabled,movementWater:water});
  let hero=(await state()).heroes[0];const limit=(water?1500:2000)*(enabled?2:1);assert.equal(hero.movementLimit,limit);assert.equal(hero.movement,limit);
  await walk(1);hero=(await state()).heroes[0];assert.equal(hero.movement,limit-100);assert.equal(hero.movementLimit,limit);
  await nextDay();hero=(await state()).heroes[0];assert.equal(hero.movement,limit);assert.equal(hero.movementLimit,limit);
  if(process.env.MOVEMENT_SAVE){
   await walk(-1);const save=[...await readCompletedNativeSave(page,command,{tag:828})];await page.close();await boot({save,enabled:false,doubleMovement:false});
   hero=(await state()).heroes[0];assert.equal(hero.movement,limit-100);assert.equal(hero.movementLimit,limit);await nextDay();assert.equal((await state()).heroes[0].movement,limit);
   report.scenarios.push('map-rule-121-budget-and-setting-survive-save-and-global-config-change');
  }
  if(process.env.MOVEMENT_RECRUIT){
   const previous=(await state()).heroes.map(hero=>hero.id);await command(5,0);await wait(()=>goonkMobileState.mode==='town');const tavern=(await state()).buildings.find(building=>building.key.endsWith(':tavern'));assert(tavern?.built);await command(39,tavern.id);await wait(()=>goonkMobileState.tavernHeroes&&goonkMobileState.tavern?.canRecruit);
   const candidate=(await state()).tavernHeroes['0'];assert(candidate);await command(86,0,candidate.id);
   await wait(count=>goonkMobileState.heroes?.length>count,previous.length);const recruit=(await state()).heroes.find(hero=>!previous.includes(hero.id));assert(recruit);
   assert.equal(recruit.movement,recruit.movementLimit,JSON.stringify(recruit));assert(recruit.movementLimit>=3000,JSON.stringify(recruit));
   report.scenarios.push('map-rule-121-newly-hired-hero-starts-with-full-doubled-budget');
  }
  report.scenarios.push(enabled?(water?'map-rule-121-doubles-daily-sailing-budget-with-normal-sailing-cost':'map-rule-121-doubles-daily-budget-with-normal-walking-cost'):(water?'map-rule-121-disabled-preserves-normal-sailing':'map-rule-121-disabled-preserves-normal-movement'));await page.close();
 }
 if(process.env.CASES==='multiple-capitols'||process.env.CASES==='multiple-capitols-capture'){
  const enabled=!process.env.CAPITOL_DISABLED,capturing=process.env.CASES==='multiple-capitols-capture';
  await boot({enabled:false,capitolFixture:true,capitolCapture:capturing,multipleCapitols:enabled,goldFunds:20000});
  if(process.env.CAPITOL_SAVE){const save=[...await readCompletedNativeSave(page,command,{tag:826})];await page.close();await boot({save,enabled:false,multipleCapitols:false});}
  if(capturing){
   await command(6);await page.waitForTimeout(150);const point=await page.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+96,y:v.y+v.h/2+32};});
   await page.evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);
   for(let i=0;i<300;++i){const data=await state();if(data.towns?.some(row=>row.name.endsWith('Second Capitol')))break;if(data.mode==='dialog')await command(1);await page.waitForTimeout(100);}
  }
  const town=(await state()).towns.find(row=>row.name.endsWith('Second Capitol'));assert(town,JSON.stringify((await state()).towns));
  if((await state()).mode!=='town')await command(5,town.index);await wait(()=>goonkMobileState.mode==='town');
  if(capturing){const cap=(await state()).buildings.find(row=>row.key.endsWith(':capitol'));assert.equal(cap?.built,enabled,JSON.stringify(cap));report.scenarios.push(enabled?'map-rule-124-preserves-captured-capitol':'map-rule-124-disabled-removes-second-captured-capitol');await page.close();}
  else{
  const building=(await state()).buildings.find(row=>row.key.endsWith(':capitol'));assert(building&&!building.built,JSON.stringify(building));
  fs.writeFileSync(path.join(output,'capitol-before.json'),JSON.stringify({town,building},null,2));
  const before=(await state()).resources[6];await command(8,building.id);
  if(enabled){await wait(()=>goonkMobileState.buildings.some(row=>row.key.endsWith(':capitol')&&row.built));assert.equal((await state()).resources[6],before-10000);}
  else{await page.waitForTimeout(500);assert(!(await state()).buildings.find(row=>row.key.endsWith(':capitol')).built);assert.equal((await state()).resources[6],before);}
  report.scenarios.push(enabled?'map-rule-124-allows-second-capitol-with-normal-cost':'map-rule-124-disabled-preserves-single-capitol-limit');
  if(process.env.CAPITOL_SAVE)report.scenarios.push('map-rule-124-survives-save-and-global-config-change');
  await page.close();}
 }
 if(process.env.CASES?.startsWith('daily-plains')){
  const ownerCase=process.env.CASES==='daily-plains-owner',ownerAfter=!!process.env.PLAINS_OWNER_AFTER;
  const firstDay=process.env.CASES==='daily-plains-day1',block=ownerCase?'water':process.env.PLAINS_BLOCK||'',enabled=process.env.CASES!=='daily-plains-standalone';
  await boot({enabled,dailyPlains:true,plainsFight:true,plainsBlock:block,bluePlainsOwner:ownerCase});let data;
  if(enabled){data=await panel();assert(!data.offers.some(row=>row.kind===8));const amount=data.amount;await command(1200,0,7,data.revision);await page.waitForTimeout(200);assert.equal((await state()).mithril.amount,amount);}
  if(!firstDay){await nextDay();if(enabled)await panel();assert.equal((await state()).day,2);}
  if(ownerCase&&ownerAfter){await nextDay();assert.equal((await state()).day,3);}
  if(await page.locator('.mithril-panel').isVisible())await page.locator('[data-mithril-close]').tap();
  if(process.env.PLAINS_SAVE){const save=[...await readCompletedNativeSave(page,command,{tag:822})];await page.close();await boot({save,dailyPlains:false});data=await panel();assert(!data.offers.some(row=>row.kind===8));await page.locator('[data-mithril-close]').tap();}
  await command(6);await page.waitForTimeout(150);const point=await page.evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+32,y:v.y+v.h/2};});
  await page.evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');await command(15);await wait(()=>goonkMobileState.canAct);
  await command(14,0);await wait(()=>goonkMobileState.mode==='spellbook');const book=(await state()).spellbook;
  for(const id of [41,43,53,54]){const spell=book.spells.find(row=>row.id===id);assert(spell);assert.equal(spell.target==='none',ownerCase?ownerAfter:!firstDay&&!block,'Expert mass cast for spell '+id);}
  report.scenarios.push(ownerCase?(ownerAfter?'daily-magic-plains-appear-after-enemy-owner-turn':'daily-magic-plains-wait-for-enemy-owner-turn'):firstDay?'daily-magic-plains-do-not-appear-on-first-day':block?'daily-magic-plains-skip-'+block:'daily-magic-plains-grant-four-expert-schools-in-field-battle');
  if(enabled)report.scenarios.push('daily-magic-plains-block-town-mithril-purchases');
  else report.scenarios.push('daily-magic-plains-work-without-mithril-module');
  if(process.env.PLAINS_SAVE)report.scenarios.push('daily-magic-plains-setting-and-patches-survive-native-save-reload');await page.close();
 }
 if(process.env.CASES==='shrine-rng'||process.env.CASES==='hut-rng'){
  const hut=process.env.CASES==='hut-rng',label=hut?'hut':'shrine';
  const skillNames=['Pathfinding','Archery','Logistics','Scouting','Diplomacy','Navigation','Leadership','Wisdom','Mysticism','Luck','Ballistics','Eagle Eye','Necromancy','Estates','Fire Magic','Air Magic','Water Magic','Earth Magic','Scholar','Tactics','Artillery','Learning','Offense','Armorer','Intelligence','Sorcery','Resistance','First Aid'];
  const reference=JSON.parse(fs.readFileSync('tests/fixtures/era-gameplay/mithril-random-reference.json','utf8'))[hut?'hutSequence':'shrineSequence'];
  await boot({reroll:hut?'hut-rng':'rng'});await walk(2);const observed=[];let previous=reference.initial;
  for(let roll=0;roll<reference.draws;++roll){
   const shrine=(await panel()).offers.find(row=>row.kind===(hut?5:4));assert(shrine);if(roll===0)assert.equal(shrine.current,hut?'Offense':'Bless');await buy(shrine);
   const name=(await state()).mithril.offers.find(row=>row.id===shrine.id).current;
   const chosen=hut?skillNames.indexOf(name):{Bless:41,Haste:53,Slow:54}[name];assert(chosen!==undefined&&chosen>=0,name);assert.notEqual(chosen,previous);assert(reference.eligible.includes(chosen));observed.push(chosen);previous=chosen;
   if(roll===15){await page.locator('[data-mithril-close]').tap();const save=[...await readCompletedNativeSave(page,command,{tag:821})];fs.writeFileSync(path.join(output,'sequence-save.vsgm1'),Buffer.from(save));await page.close();await boot({save});}
  }
  assert(reference.vectors.some(row=>JSON.stringify(row[hut?'skills':'spells'])===JSON.stringify(observed)),JSON.stringify(observed));
  report.scenarios.push(label+'-32-rerolls-match-compiled-pascal-and-coordinate-seed');
  report.scenarios.push(label+'-rerolls-exclude-current-and-map-banned-offerings');
  report.scenarios.push(label+'-source-random-sequence-continues-after-native-save-reload');await page.close();
 }
 if(process.env.CASES==='weekly-mines'){
  await boot({weeklyMines:true,changingMine:true});let data=await panel();
  const gold=data.offers.find(row=>row.id===3),ore=data.offers.find(row=>row.id===4);assert(gold&&ore);
  assert.equal(gold.cost,5);assert.equal(ore.cost,1);assert(gold.protection&&ore.protection);assert.equal(gold.dailyIncome,1000);
  assert.equal(data.offers.find(row=>row.x===15&&row.y===11).dailyIncome,123);await buy(ore);
  assert.equal((await state()).mithril.offers.find(row=>row.id===ore.id).dailyIncome,2);
  await nextDay();await panel();assert.equal((await state()).mithril.offers.find(row=>row.id===ore.id).days,6);
  await page.locator('[data-mithril-close]').tap();let save=[...await readCompletedNativeSave(page,command,{tag:819})];await page.close();
  await boot({save,weeklyMines:false,changingMine:true});data=await panel();assert(data.offers.find(row=>row.id===ore.id).active);assert(data.offers.find(row=>row.id===gold.id).protection);
  report.scenarios.push('weekly-mine-rule-and-protection-frozen-in-native-save');
  for(let day=3;day<=7;++day){await nextDay();await panel();assert.equal((await state()).day,day);}
  await buy((await state()).mithril.offers.find(row=>row.id===gold.id));
  assert.equal((await state()).mithril.offers.find(row=>row.id===gold.id).days,1);
  await nextDay();data=await panel();assert.equal((await state()).day,8);
  for(const previous of [gold,ore]){const mine=data.offers.find(row=>row.id===previous.id);assert(mine&&!mine.active);assert.equal(mine.resource,previous.resource);assert.equal(mine.dailyIncome,previous.dailyIncome);}
  report.scenarios.push('mithril-protects-mines-until-next-monday-without-doubling-income');
  const changed=data.offers.find(row=>row.x===15&&row.y===11);assert(changed);assert([1,3,5].includes(changed.cost));assert.equal(changed.dailyIncome,changed.cost===5?1000:changed.cost===1?2:1);
  report.scenarios.push('weekly-mine-reroll-replicates-resource-and-resets-standard-production');
  await page.locator('[data-mithril-close]').tap();save=[...await readCompletedNativeSave(page,command,{tag:820})];await page.close();
  await boot({save,weeklyMines:false,changingMine:true});data=await panel();const restored=data.offers.find(row=>row.id===changed.id);assert.equal(restored.resource,changed.resource);assert.equal(restored.dailyIncome,changed.dailyIncome);
  report.scenarios.push('changed-mine-resource-and-production-survive-native-save-reload');await page.close();
 }
 if(process.env.CASES?.startsWith('siege')){
  const choice=Number(process.env.SIEGE_CHOICE||0);await boot({siege:true});
  if(process.env.SIEGE_PREVIOUS!==undefined){const prior=(await panel()).offers.find(row=>row.kind===8&&row.choice===Number(process.env.SIEGE_PREVIOUS));assert(prior);await buy(prior);}
  const town=(await panel()).offers.find(row=>row.kind===8&&row.choice===choice);assert(town);await buy(town);await page.locator('[data-mithril-close]').tap();
  if(process.env.SIEGE_SAVE){const save=[...await readCompletedNativeSave(page,command,{tag:818})];await page.close();await boot({save});}
  await command(3);
  for(let i=0;i<600;++i){const s=await state();if(s.mode==='battle'){await command(15);if(s.canAct)break;}else if(s.mode==='dialog')await command(1);await page.waitForTimeout(100);}
  await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);
  const units=(await state()).battleUnits;assert(units.some(row=>row.enemy&&row.key==='core:catapult'),'The terrain effects must be tested in an actual siege');fs.writeFileSync(path.join(output,'siege-units.json'),JSON.stringify(units,null,2));
  const own=key=>units.find(row=>!row.enemy&&row.key==='core:'+key);
  if(choice===0){assert.equal(own('pikeman').morale,own('nomad').morale+1);assert.equal(own('troglodyte').morale,own('nomad').morale-1);}
  else if(choice===1){assert.equal(own('nomad').luck,own('pikeman').luck+2);if(process.env.SIEGE_PREVIOUS!==undefined){assert.equal(own('pikeman').morale,own('nomad').morale);assert.equal(own('troglodyte').morale,own('nomad').morale);}}
  else if(choice===2){assert.equal(own('pikeman').morale,own('nomad').morale-1);assert.equal(own('troglodyte').morale,own('nomad').morale+1);}
  else{
   await command(14,0);await wait(()=>goonkMobileState.mode==='spellbook');const book=(await state()).spellbook;
   fs.writeFileSync(path.join(output,'siege-spells.json'),JSON.stringify(book,null,2));
   const spell=id=>book.spells.find(row=>row.id===id);
   if(choice===3)assert.equal(spell(43).target,'none'); // Bloodlust: Fire expert mass cast
   if(choice===4)assert.equal(spell(41).target,'none'); // Bless: Water expert mass cast
   if(choice===5)assert.equal(spell(53).target,'none'); // Haste: Air expert mass cast
   if(choice===6)assert.equal(spell(54).target,'none'); // Slow: Earth expert mass cast
   if(choice===7)for(const id of [43,41,53,54])assert.equal(spell(id).target,'none');
   if(choice===8){assert(!spell(24)?.enabled);assert(spell(43).enabled);assert(units.every(row=>row.morale===0&&row.luck===0));}
  }
  report.scenarios.push('town-siege-terrain-choice-'+choice+(process.env.SIEGE_PREVIOUS===undefined?'':'-replaces-'+process.env.SIEGE_PREVIOUS)+(process.env.SIEGE_SAVE?'-after-native-save-reload':''));await page.close();
 }
 if(!process.env.CASES||process.env.CASES==='sites'){
 await boot({henchmen:true});let data=await panel();
 assert.equal(data.amount,100);
 fs.writeFileSync(path.join(output,'offers-initial.json'),JSON.stringify(data,null,2));
 const gold=data.offers.find(row=>row.kind===0&&row.cost===7);assert(gold);
 const ore=data.offers.find(row=>row.kind===0&&row.cost===4);assert(ore);
 assert.equal(data.offers.filter(row=>row.kind===0).length,2);
 assert.equal(gold.dailyIncome,1000);await buy(gold);
 let current=(await state()).mithril.offers.find(row=>row.id===gold.id);
 assert(current.active&&current.days===7&&current.dailyIncome===2000);
 // A stale request must not charge twice or extend the same improvement.
 const amount=(await state()).mithril.amount;
 await command(1200,ore.id,0,data.revision);await page.waitForTimeout(300);
 assert.equal((await state()).mithril.amount,amount);
 await command(1200,5,0,(await state()).mithril.revision);await page.waitForTimeout(300);
 assert.equal((await state()).mithril.amount,amount);
 report.scenarios.push('owned-mine-double-income-payment-and-stale-request');
 await page.locator('[data-mithril-close]').tap();await page.locator('[data-ui=heroes]').tap();
 await wait(()=>goonkMobileState.heroWindow?.henchman);await page.locator('[data-hero-tab=henchman]').tap();
 await page.locator('[data-henchman-slot="0"]').tap();await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:archangel');
 await command(63);await wait(()=>goonkMobileState.mode==='map');await panel();
 assert.equal((await state()).mithril.amount,amount);
 report.scenarios.push('companion-and-mithril-transactions-coexist');
 data=(await state()).mithril;
 const dwelling=data.offers.find(row=>row.kind===1&&row.cost===1);assert(dwelling,JSON.stringify(data));
 assert(/halberd/i.test(dwelling.upgrade));await buy(dwelling);
 assert(!(await state()).mithril.offers.some(row=>row.id===dwelling.id&&row.cost===1));
 report.scenarios.push('native-dwelling-upgrade-preserves-stock');
 const mill=(await state()).mithril.offers.find(row=>row.kind===2);assert(mill);await buy(mill);
 assert((await state()).mithril.offers.some(row=>row.id===mill.id&&row.active));
 report.scenarios.push('nearby-weekly-site-payment');
 const university=(await state()).mithril.offers.find(row=>row.kind===3&&!row.active);assert(university);await buy(university);
 assert((await state()).mithril.offers.some(row=>row.id===university.id&&row.active));
 report.scenarios.push('advanced-university-payment');
 const shipyard=(await state()).mithril.offers.find(row=>row.kind===7);assert(shipyard);await buy(shipyard);
 assert(!(await state()).mithril.offers.some(row=>row.id===shipyard.id));
 report.scenarios.push('owned-shipyard-creates-lighthouse');
 const town=(await state()).mithril.offers.find(row=>row.kind===8&&row.choice===7);assert(town);await buy(town);
 report.scenarios.push('town-magical-terrain-payment');
 const portal=(await state()).mithril.offers.find(row=>row.kind===6);assert(portal);
 const exitPixel=()=>page.evaluate(()=>{const canvas=window.goonkMinimapAtlas;return [...canvas.getContext('2d').getImageData(Math.floor(16.5*canvas.width/36),Math.floor(16.5*canvas.height/36),1,1).data].slice(0,3);});
 assert.deepEqual(await exitPixel(),[0,0,0]);const originalViewport=(await state()).mapOverview.viewport;await buy(portal);
 await wait(view=>goonkMobileState.mapOverview?.viewport?.x>view.x+4,originalViewport);
 await wait(()=>{const canvas=window.goonkMinimapAtlas;return [...canvas.getContext('2d').getImageData(Math.floor(16.5*canvas.width/36),Math.floor(16.5*canvas.height/36),1,1).data].slice(0,3).some(v=>v>0);});
 report.scenarios.push('monolith-exit-fog-revealed');
 await wait(point=>{const view=goonkMobileState.mapOverview?.viewport;return view&&Math.abs(view.x+view.w/2-point.x)<=2&&Math.abs(view.y+view.h/2-point.y)<=2;},portal);
 report.scenarios.push('monolith-camera-shows-exit-and-returns-to-selected-entrance');await panel();
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1024,height:768}]){
  await page.setViewportSize(viewport);
  const layout=await page.locator('.mithril-panel').evaluate(node=>({width:node.clientWidth,scrollWidth:node.scrollWidth,closes:node.querySelectorAll('[data-mithril-close]').length,scroll:getComputedStyle(node.querySelector('.mithril-content')).overflowY,small:[...node.querySelectorAll('button')].some(button=>button.getBoundingClientRect().height<44)}));
  assert(layout.closes===1&&!layout.small&&layout.scrollWidth<=layout.width+1&&['auto','scroll'].includes(layout.scroll),JSON.stringify(layout));
 }
 await page.screenshot({path:path.join(output,'mithril-sites.png')});
 report.scenarios.push('phone-and-ipad-scrollable-layout');
 await page.locator('[data-mithril-close]').tap();
 const saved=await readCompletedNativeSave(page,command,{tag:917});
 await page.close();await boot({save:[...saved],henchmen:true});
 await page.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.heroWindow?.henchman?.unit);
 assert.equal((await state()).heroWindow.henchman.unit.key,'core:archangel');assert((await state()).heroWindow.henchman.alive);
 await command(63);await wait(()=>goonkMobileState.mode==='map');data=await panel();
 report.scenarios.push('companion-and-mithril-restored-from-same-save');
 assert(data.offers.some(row=>row.id===gold.id&&row.active&&row.days===7&&row.dailyIncome===2000));
 report.scenarios.push('native-save-reload');
 for(let day=2;day<=8;++day){await nextDay();data=await panel();assert.equal((await state()).day,day);const mine=data.offers.find(row=>row.id===gold.id);assert(mine);assert.equal(mine.active,day<8);assert.equal(mine.dailyIncome,day<8?2000:1000);}
 report.scenarios.push('mine-expires-after-seven-income-periods');
 await page.close();await boot({enabled:false});assert.equal(await page.locator('button[data-mithril-open]').isVisible(),false);
 report.scenarios.push('disabled-module-baseline');
 await page.close();await boot({funds:0});data=await panel();assert.equal(data.amount,0);
 assert(data.offers.every(row=>!row.available));await command(1200,0,7,data.revision);await page.waitForTimeout(300);
 assert.equal((await state()).mithril.amount,0);assert.equal((await state()).mithril.revision,data.revision);
 report.scenarios.push('insufficient-mithril-rejected-by-server');await page.close();
 }
 if(!process.env.CASES||process.env.CASES==='payout'){
  const rewards=[];
  for(const enhanced of [false,true]){
   await boot({reroll:'payout'});const data=await panel(),wheel=data.offers.find(row=>row.id===7&&row.kind===2);assert(wheel);
   if(enhanced)await buy(wheel);await page.locator('[data-mithril-close]').tap();
   let gold=(await state()).resources[6];await walk(1);const first=(await state()).resources[6]-gold;assert(first>0);
   for(let day=2;day<=8;++day){await panel();await nextDay();}
   await walk(-1);gold=(await state()).resources[6];await walk(1);const second=(await state()).resources[6]-gold;assert(second>0);
   rewards.push({first,second});await page.close();
  }
  assert.equal(rewards[1].first,2*rewards[0].first);assert.equal(rewards[1].second,2*rewards[0].second);
  report.scenarios.push('waterwheel-actual-reward-doubled-on-first-and-second-week');
 }
 if(!process.env.CASES||process.env.CASES==='conflux'){
  await boot({reroll:'conflux'});assert.equal((await walk(1)).mode,'recruit');
  const before=await recruitmentStock();assert.equal(Object.keys(before).length,4);await command(33);await wait(()=>goonkMobileState.mode==='map');
  const conflux=(await panel()).offers.find(row=>row.id===7&&row.kind===1);assert(conflux);assert.equal(conflux.cost,4);assert.equal(conflux.upgrades.length,4);await buy(conflux);await page.locator('[data-mithril-close]').tap();
  await walk(-1);assert.equal((await walk(1)).mode,'recruit');const after=await recruitmentStock();
  for(const [base,upgrade] of [['airElemental','stormElemental'],['waterElemental','iceElemental'],['fireElemental','energyElemental'],['earthElemental','magmaElemental']])assert.equal(after['core:'+upgrade],before['core:'+base],JSON.stringify({base,upgrade,before,after}));
  report.scenarios.push('conflux-upgrades-all-four-native-recruitment-stocks');await page.close();
 }
 if(!process.env.CASES||process.env.CASES==='preservation'){
  await boot({reroll:'shrine',preserveRewards:true});let gold=(await state()).resources[6];
  await walk(2);const first=(await state()).resources[6]-gold;assert(first>=1001&&first<=9999);
  const shrine=(await panel()).offers.find(row=>row.kind===4);assert(shrine);await buy(shrine);await page.locator('[data-mithril-close]').tap();
  await walk(-1);gold=(await state()).resources[6];await walk(1);const second=(await state()).resources[6]-gold;
  assert.equal(second,first,'Changing the offered spell must preserve the already rolled gold reward');
  report.scenarios.push('shrine-reroll-preserves-already-randomized-extra-rewards');await page.close();
 }
 for(const kind of ['shrine','hut','university']){
  if(process.env.CASES&&process.env.CASES!==kind&&process.env.CASES!=='rerolls')continue;
  await boot({reroll:kind,universityTwo:!!process.env.UNIVERSITY_TWO,goldFunds:process.env.UNIVERSITY_POOR?2299:null});
  if(kind==='university'){
   const university=(await panel()).offers.find(row=>row.id===7&&row.kind===3);assert(university);await buy(university);
   await page.locator('[data-mithril-close]').tap();
  }
  await command(6);await page.waitForTimeout(150);
  const point=await page.evaluate(offset=>{const view=goonkMobileState.mapOverview.view;return{x:view.x+view.w/2+offset,y:view.y+view.h/2};},kind==='university'?32:64);
  await page.evaluate(point=>Module._vcmiMobilePointer(point.x,point.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);
  if(kind==='university'){
   await wait(()=>goonkMobileState.mode==='dialog');
   const before=(await state()).resources[6];await command(1);
   await wait(()=>goonkMobileState.mode==='dialog'&&JSON.stringify(goonkMobileState.dialogPresentation||{}).includes('3000'));
   if(process.env.UNIVERSITY_POOR){
    assert(before<3000);await command(1);await wait(()=>goonkMobileState.mode==='map');
    assert.equal((await state()).resources[6],before);
    await page.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.heroWindow);
    assert((await state()).heroWindow.skills.filter(row=>/wisdom|air magic/i.test(row.name)).every(row=>/basic/i.test(row.mastery)));
    report.scenarios.push('advanced-university-insufficient-gold-preserves-skills-and-funds');await page.close();continue;
   }
   if(process.env.UNIVERSITY_TWO){
    const form=(await state()).dialogPresentation;fs.writeFileSync(path.join(output,'selection.json'),JSON.stringify(form,null,2));
    const index=Number(process.env.UNIVERSITY_CHOICE||0);await command(98,index,form.queryId);await command(99,index,form.queryId);
   }else await command(1);
   await wait(before=>goonkMobileState.mode==='map'&&goonkMobileState.resources[6]===before-3000,before);
   await page.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.heroWindow);
   const skills=(await state()).heroWindow.skills;
   const chosen=process.env.UNIVERSITY_TWO&&Number(process.env.UNIVERSITY_CHOICE||0)===1?/air magic/i:/wisdom/i;
   assert(skills.some(row=>chosen.test(row.name)&&/advanced/i.test(row.mastery)),JSON.stringify(skills));
   if(process.env.UNIVERSITY_TWO)assert(skills.some(row=>(chosen.test('Wisdom')?/air magic/i:/wisdom/i).test(row.name)&&/basic/i.test(row.mastery)),JSON.stringify(skills));
   report.scenarios.push(process.env.UNIVERSITY_TWO?'advanced-university-two-skills-choice-'+(process.env.UNIVERSITY_CHOICE||0):'advanced-university-post-visit-skill-and-3000-gold');await page.close();continue;
  }
  for(let i=0;i<300;++i){const s=await state();if(s.mode==='dialog')await command(1);else if(s.mode==='map'&&!s.hasPath&&!s.heroMoving)break;await page.waitForTimeout(100);}
  const data=await panel();const offering=data.offers.find(row=>row.kind===(kind==='shrine'?4:5));assert(offering,JSON.stringify(data));
  assert(offering.current);await buy(offering);
  assert.notEqual((await state()).mithril.offers.find(row=>row.id===offering.id).current,offering.current);
  report.scenarios.push(kind+'-visited-object-rerolled-with-payment');await page.close();
 }
 assert.deepEqual(report.errors,[]);
 fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,...report},null,2));
}catch(error){
 if(page){await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(output,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));const log=await page.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'});}catch{return '';}}).catch(()=> '');fs.writeFileSync(path.join(output,'native-failure.log'),log);}
 console.error(error);process.exitCode=1;
}finally{await browser.close();}
