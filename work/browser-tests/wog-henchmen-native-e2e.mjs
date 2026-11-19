import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {silenceTestAudio} from './silent-audio.mjs';
import {readCompletedNativeSave} from './native-save-completed.mjs';
import {openNativeAccordion,revealNativeAction,selectHeroTab} from './native-ui-actions.mjs';
import {readJsonc} from '../../scripts/era-bridge/objects/production-resolvers.mjs';

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

function townVisitProgram(){
 const number=value=>({kind:'number',access:'read',number:value});
 const message=text=>({receiver:'IF',selectors:[],conditions:[],operations:[{code:'M',args:[{kind:'string',access:'read',text}]}]});
 const program={originalMessages:['ZVSE private native companion town continuation'],initializers:[],blocks:[
  {kind:'trigger',receiver:'OB',selectors:[number(98)],conditions:[],commands:[message('BEFORE COMPANION TOWN VISIT')]},
  {kind:'post-trigger',receiver:'OB',selectors:[number(98)],conditions:[],commands:[message('AFTER COMPANION TOWN VISIT')]}
 ]};
 program.sha256=createHash('sha256').update(JSON.stringify(program)).digest('hex');return program;
}

function fixture({townBannerFixture=null,levelArtifactVisitFixture=false,artifactGrantFixture=null,artifactPoolFixture=null,fogFixture=null,eighthUpgradeFixture=null,retreatFixture=false,growthFixture=false,heroLevelLimit=0,dead=false,inTown=false,enemyHero=false,santa=false,stackExperience=0,bannerInventory=false,henchmanType=null,henchmanBanner=-1,enemyCount=1,archangels=5,enemyType='core:peasant',bless=false,blockFixture=false,reserveHero=false,fullArmy=false,soloArmy=false,twoGuards=false,aiTown=false,foreignTown=false,scriptTown=false,scriptAI=false,aiNoActor=null,tilePropertiesFixture=false,artifactFixture=null}={}){
 return execFileSync('python3',['-c',String.raw`
import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1])
with zipfile.ZipFile('maps/000-Goonk.vmap') as archive: entries={n:archive.read(n) for n in archive.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
if opts['scriptTown'] or opts['scriptAI']:
 import copy
 town=next(o for o in objects if o['instanceName']=='goonkTown');castle=next(o for o in objects if o['instanceName']=='enemyTown')
 town.update({'subtype':'core:castle','x':10,'template':copy.deepcopy(castle['template']),'options':{'owner':'red','name':'Goonkbourg','hasFort':True,'army':[],'buildings':{'allOf':['core:villageHall','core:fort'],'noneOf':['core:tavern']}}})
if opts['retreatFixture']:
 import copy
 town=next(o for o in objects if o['instanceName']=='goonkTown');castle=next(o for o in objects if o['instanceName']=='enemyTown')
 town.update({'subtype':'core:castle','template':copy.deepcopy(castle['template'])})
 town['options']['buildings']={'allOf':['core:villageHall','core:fort','core:tavern'],'noneOf':[]}
if opts['aiTown']:
 town=next(o for o in objects if o['instanceName']=='enemyTown')
 town['options']['buildings']={'allOf':['core:villageHall','core:fort','core:mageGuild1'],'noneOf':['core:tavern']}
for o in objects:
 if o['instanceName']=='goonkHero':
  o['options'].update({'type':'core:christian','experience':0,'primarySkills':{'attack':0,'defence':0,'spellpower':1,'knowledge':10},'army':[{'type':'core:peasant','amount':100},{'type':'core:archangel','amount':5}],'artifacts':{'spellbook':'core:spellBook'}})
  o['options']['army'][1]['amount']=opts['archangels']
  if opts['bless']:o['options'].update({'spellBook':['preset','core:bless'],'secondarySkills':{}})
  if opts['bannerInventory']: o['options']['artifacts']['backpack']=['wake-of-gods.stackartifacts:warlordsBannerHealth']
  if opts['inTown']: o['y']=9
  if opts['aiTown']: o.update({'x':29,'y':32})
  if opts['foreignTown']: o.update({'x':28,'y':32})
  if opts['dead']: o['options']['henchman']={'type':'core:peasant','experience':100,'stackExperience':opts['stackExperience'],'alive':False,'declined':False,'banner':opts['henchmanBanner']}
  if opts['santa']: o['options']['henchman']={'type':'wake-of-gods.creatures:santaGremlin','experience':1000,'stackExperience':opts['stackExperience'],'alive':True,'declined':False,'banner':-1}
  if opts['henchmanType']: o['options']['henchman']={'type':opts['henchmanType'],'experience':0,'stackExperience':opts['stackExperience'],'alive':True,'declined':False,'banner':opts['henchmanBanner']}
  if opts['blockFixture']: o['options']['artifacts']={'misc1':'core:shacklesOfWar'}
  if opts['fullArmy']: o['options']['army'] += [{'type':'core:'+name,'amount':4} for name in ['archer','griffin','monk','pikeman','swordsman']]
  if opts['soloArmy']: o['options']['army']=[{'type':'core:peasant','amount':1}]
  if opts['scriptAI']: o['options'].update({'army':[{'type':'core:peasant','amount':1}],'artifacts':{'misc1':'core:shacklesOfWar'}})
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
 if opts['scriptAI']:
  enemy['options'].update({'patrolRadius':0,'army':[{'type':'core:archangel','amount':5},{'type':'core:archer','amount':10}],
   'henchman':{'type':'core:archer','experience':100,'stackExperience':0,'alive':True,'declined':False,'banner':-1}})
 if opts['aiNoActor']:
  enemy['options']['army']=[{'type':'wake-of-gods.messengersandemissaries:emissaryOfWar','amount':1000}]
  if opts['aiNoActor']=='none': enemy['options'].pop('henchman',None)
  else: enemy['options']['henchman'].update({'alive':False,'stackExperience':2500})
 if opts['aiTown']:
  enemy.update({'x':29,'y':30})
  enemy['options'].update({'patrolRadius':2,'spellBook':[],'henchman':{'type':'core:peasant','experience':100,'stackExperience':2500,'alive':False,'declined':False,'banner':8}})
 if opts['blockFixture']:
  enemy['options'].pop('henchman',None)
  enemy['options'].update({'army':[{'type':'core:goblin','amount':1}],'primarySkills':{'attack':0,'defence':0,'spellpower':0,'knowledge':0},'secondarySkills':{},'artifacts':{}})
 objects.append(enemy)
else:
 objects.append({'type':'core:monster','subtype':opts['enemyType'],'instanceName':'henchmenTrainingGuard','x':10,'y':11,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':opts['enemyCount'],'character':'savage','neverFlees':True}})
 if opts['twoGuards']:
  import copy
  guard=copy.deepcopy(objects[-1]);guard.update({'instanceName':'henchmenSecondGuard','x':12});objects.append(guard)
if opts['growthFixture']:
 for o in objects:
  if o['instanceName']=='goonkHero':
   o['options']['army']=[{'type':'core:'+kind,'amount':count} for kind,count in zip(['peasant','archer','griffin','monk','pikeman','swordsman','archangel'],[100000,24,49,99999,25,100001,300])]
   o['options']['artifacts']['misc1']='core:shacklesOfWar'
  if o['instanceName']=='enemyTown':o['options'].update({'army':[],'buildings':{'allOf':['core:villageHall','core:fort'],'noneOf':['core:tavern']}})
  if o['instanceName']=='enemyHenchmanHero':
   o.update({'x':30,'y':30});o['options'].update({'army':[{'type':'core:peasant','amount':50}],'patrolRadius':0})
 import copy
 training=copy.deepcopy(next(o for o in objects if o['instanceName']=='enemyHenchmanHero'))
 training.update({'instanceName':'growthTrainingHero','x':10,'y':11})
 training['options'].update({'type':'core:edric','army':[{'type':'core:peasant','amount':6500}],'artifacts':{},'spellBook':[],'secondarySkills':{}})
 objects.append(training)
if opts['eighthUpgradeFixture']:
 f=opts['eighthUpgradeFixture']
 hero=next(o for o in objects if o['instanceName']=='goonkHero')
 hero['options']['army']=f['army']
 if f.get('recruit'):
  town=next(o for o in objects if o['instanceName']=='goonkTown');town['options']['buildings']['allOf'].append('core:dwellingLvl2')
 for o in objects:
  if o['instanceName']=='enemyHenchmanHero':
   o.update({'x':30,'y':30});o['options'].update({'army':[{'type':'core:archangel','amount':50}],'patrolRadius':0})
 if f.get('battle'):
  for name,x,count in [('eighthTrainingGuard',10,f.get('trainingCount',1000000)),('eighthRepairGuard',12,f.get('repairCount',100))]:
   objects.append({'type':'core:monster','subtype':'core:peasant','instanceName':name,'x':x,'y':11,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':count,'character':'savage','neverFlees':True}})
if opts['eighthUpgradeFixture'] and opts['eighthUpgradeFixture'].get('singleStack'):
 import copy
 for i,o in enumerate(objects):
  if o['instanceName'] in ['eighthTrainingGuard','eighthRepairGuard']:
   h=copy.deepcopy(next(x for x in objects if x['instanceName']=='goonkHero'))
   h.update({'instanceName':o['instanceName'],'x':o['x'],'y':o['y']})
   h['options'].update({'owner':'blue','type':'core:edric' if o['x']==10 else 'core:adela','patrolRadius':0,'army':[{'type':'core:peasant','amount':o['options']['amount']}],'artifacts':{},'spellBook':[],'secondarySkills':{}})
   objects[i]=h
if opts['artifactFixture']:
 f=opts['artifactFixture'];objects=[o for o in objects if o['instanceName']!='henchmenTrainingGuard']
 h=next(o for o in objects if o['instanceName']=='goonkHero');h['options']['type']='core:orrin'
 h['options']['artifacts']={'spellbook':'core:spellBook'}
 kind=f.get('type','core:centaurAxe');existing=f.get('existing','none')
 if existing in ['bag','two']:h['options']['artifacts']['backpack']=[kind]
 if existing in ['worn','two']:h['options']['artifacts']['rightHand']=kind
 if existing=='combo':h['options']['artifacts']['misc1']='core:elixirOfLife'
 if existing=='combo-bag':h['options']['artifacts']['backpack']=['core:elixirOfLife']
 if existing in ['full','blocked-full']:h['options']['artifacts']['backpack']=['core:quietEyeOfTheDragon']*64
 if existing=='blocked-full':h['options']['artifacts']['rightHand']='core:blackshardOfTheDeadKnight'
 artifact={'instanceName':'doubleArtifactTarget','type':'core:artifact','subtype':kind,'x':10,'y':11,'l':0,
  'template':{'animation':f.get('animation','AVA0007.def'),'mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}}
 if f.get('guarded'):artifact['options']['guards']=[{'type':'core:goblin','amount':1}]
 if f.get('ai'):
  h['options']['owner']='blue';h['options']['patrolRadius']=1;artifact['x']=9
 objects.append(artifact)
if opts['townBannerFixture']:
 objects=[o for o in objects if o['instanceName'] not in ['henchmenTrainingGuard','henchmenSecondGuard']]
 enemy=next(o for o in objects if o['instanceName']=='enemyTown');enemy['options']['buildings']={'allOf':['core:villageHall','core:fort'],'noneOf':['core:tavern']};enemy['options']['army']=[]
 import copy
 f=opts['townBannerFixture'];town=next(o for o in objects if o['instanceName']=='goonkTown');base=copy.deepcopy(next(o for o in objects if o['instanceName']=='enemyTown'))
 town.update({'subtype':'core:castle','x':10,'y':9,'template':copy.deepcopy(base['template']),'options':{'owner':'red','name':'Banner test town','hasFort':True,'army':[],'buildings':{'allOf':['core:villageHall','core:fort'],'noneOf':['core:tavern']}}})
 if f.get('fight'):town['options']['owner']='neutral'
 if f.get('catalog'):
  objects.remove(town)
  for index,faction in enumerate(['castle','rampart','tower','inferno','necropolis','dungeon','stronghold','fortress','conflux']):
   t=copy.deepcopy(town);t.update({'subtype':'core:'+faction,'instanceName':'bannerTown'+str(index),'x':6+10*(index%3),'y':5+10*(index//3)})
   t['options']['owner']='neutral' if index%2 else 'red';objects.append(t)
 if f.get('growth'):
  t=copy.deepcopy(town);t.update({'instanceName':'neutralBannerTown','x':20,'y':20});t['options']['owner']='neutral';objects.append(t)
 for dx in [0,1,-1][:f.get('blocked',0)]:
  objects.append({'type':'core:monster','subtype':'core:peasant','instanceName':'bannerBlock'+str(dx),'x':8+dx,'y':10,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'amount':1,'character':'savage','neverFlees':True}})
if opts['levelArtifactVisitFixture']=='object':
 objects.append({'type':'tum-era:levelArtifactVisitReward','subtype':'tum-era:levelArtifactVisitReward','instanceName':'levelArtifactVisitReward','x':10,'y':11,'l':0,'template':{'animation':'AVTchst0.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}})
elif opts['levelArtifactVisitFixture']:
 town=next(o for o in objects if o['instanceName']=='goonkTown');town['options']['buildings']['allOf']+=['core:special1','core:special2']
if opts['artifactGrantFixture']:
 f=opts['artifactGrantFixture']
 for o in objects:
  if o['instanceName']=='goonkHero' or (o['instanceName']=='enemyHenchmanHero' and f.get('ai')):
   if o['instanceName']=='enemyHenchmanHero':o.update({'x':30,'y':30});o['options']['patrolRadius']=0
   if o['instanceName']=='goonkHero' and f.get('ai'):continue
   if f.get('fullBackpack'):
    o['options']['artifacts']['backpack']=['core:centaurAxe']*64
    o['options']['artifacts']['rightHand']='core:centaurAxe'
   o['options']['artifacts'].update({'head':'core:helmOfHeavenlyEnlightenment','neck':'core:celestialNecklaceOfBliss','torso':'core:armorOfWonder','feet':'core:sandalsOfTheSaint','leftHand':'core:lionsShieldOfCourage'})
if opts['artifactGrantFixture'] and opts['artifactGrantFixture'].get('nativeAssembly'):
 objects.append({'type':'core:artifact','subtype':'core:swordOfJudgement','instanceName':'nativeAssemblySword','x':10,'y':11,'l':0,'template':{'animation':'AVA0035.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{'artifact':'core:swordOfJudgement'}})
if opts['artifactPoolFixture']:objects=[o for o in objects if o['instanceName']!='henchmenTrainingGuard']
if opts['fogFixture']:
 import copy
 objects=[o for o in objects if o['instanceName']!='henchmenTrainingGuard']
 h=copy.deepcopy(next(o for o in objects if o['instanceName']=='goonkHero'));h.update({'instanceName':'fogUndergroundHero','x':8,'y':10,'l':1});h['options']['type']='core:edric';objects.append(h)
 t=copy.deepcopy(next(o for o in objects if o['instanceName']=='enemyTown'));t.update({'instanceName':'fogTanTown','x':30,'y':20});t['options']['owner']='tan';objects.append(t)
entries['objects.json']=json.dumps(objects).encode()
header=json.loads(entries['header.json']);header['name']='000 - Henchmen native validation';header['heroLevelLimit']=opts['heroLevelLimit']
if opts['scriptTown'] or opts['scriptAI']:
 header['players']['red']['allowedFactions']={'anyOf':['core:castle']};header['players']['red']['mainTown']['x']=10
 header['events']=[{'name':'private companion town continuation','firstOccurrence':499,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],'message':{'exactStrings':['ZVSE private native companion town continuation'],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}}]
 if opts['scriptAI']:
  header['events'][0]['message']['exactStrings']=['ZVSE private native companion AI reward']
  header['events'].append({'name':'transfer winning AI hero for inspection','firstOccurrence':1,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],
   'message':{'exactStrings':['2'],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
  for day in [3,4]:
   header['events'].append({'name':'owner list transition '+str(day),'firstOccurrence':day-1,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],
    'message':{'exactStrings':[str(day)],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
if opts['growthFixture']:
 header['heroLevelLimit']=1
 for day in [2,3]:header['events'].append({'name':'private growth pool witness '+str(day),'firstOccurrence':day-1,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],'message':{'exactStrings':[str(day)],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
if opts['eighthUpgradeFixture']:
 header['heroLevelLimit']=1
 for day in [2,3]:header['events'].append({'name':'private eighth upgrade day '+str(day),'firstOccurrence':day-1,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],'message':{'exactStrings':[str(day)],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
if opts['artifactFixture']:
 header['players']['red']['mainHero']='goonkHero'
 header['players']['red']['heroes']={'goonkHero':{'type':'core:orrin'}}
 if opts['artifactFixture'].get('ai'):
  header['players']['red']['mainHero']='henchmenReserveHero'
  header['players']['red']['heroes']={'henchmenReserveHero':{'type':'core:edric'}}
  header['players']['blue']['mainHero']='goonkHero'
  header['players']['blue']['heroes']={'goonkHero':{'type':'core:orrin'}}
  header['events'].append({'name':'AI artifact ownership witness','firstOccurrence':1,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],'message':{'exactStrings':['2'],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
if opts['tilePropertiesFixture']:
 header['mapLevels']['underground']={'width':36,'height':36,'index':1,'layer':'core:underground'}
 entries['underground_terrain.json']=entries['surface_terrain.json']
 header['events'].append({'name':'tile property day-two witness','firstOccurrence':1,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],'message':{'exactStrings':['2'],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
if opts['fogFixture']:
 import copy
 header['mapLevels']['underground']={'width':36,'height':36,'index':1,'layer':'core:underground'};entries['underground_terrain.json']=entries['surface_terrain.json']
 header['players']['tan']=copy.deepcopy(header['players']['blue']);header['players']['tan']['mainTown'].update({'x':29,'y':19})
 if opts['fogFixture'].get('allied'):header['teams']=[['red','blue'],['tan']]
 for day in [2,3]:header['events'].append({'name':'private fog day '+str(day),'firstOccurrence':day-1,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],'message':{'exactStrings':[str(day)],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
if opts['artifactPoolFixture']:
 header['allowedArtifacts']={'anyOf':opts['artifactPoolFixture']['allowed']}
 header['events'].append({'name':'private artifact pool fallback','firstOccurrence':1,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],'message':{'exactStrings':['2'],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
 if opts['artifactPoolFixture'].get('levelDay3'):header['events'].append({'name':'private level reward legacy witness','firstOccurrence':2,'nextOccurrence':0,'humanAffected':1,'computerAffected':0,'players':['red'],'message':{'exactStrings':['3'],'localStrings':None,'message':[0],'numbers':None,'stringsTextID':None}})
entries['header.json']=json.dumps(header).encode()
for name in ['english.json','french.json']:
 text=json.loads(entries[name]);text['mapName']='000 - Henchmen native validation';entries[name]=json.dumps(text).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in entries.items():archive.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())
`,JSON.stringify({townBannerFixture,levelArtifactVisitFixture,artifactGrantFixture,artifactPoolFixture,fogFixture,eighthUpgradeFixture,retreatFixture,growthFixture,heroLevelLimit,dead,inTown,enemyHero,santa,stackExperience,bannerInventory,henchmanType,henchmanBanner,enemyCount,archangels,enemyType,bless,blockFixture,reserveHero,fullArmy,soloArmy,twoGuards,aiTown,foreignTown,scriptTown,scriptAI,aiNoActor,tilePropertiesFixture,artifactFixture})]);
}

async function boot({save,viewport,townBannerChoice=null,levelArtifactChoice=null,levelArtifactsConfigured=false,fogChoice=null,fogConfigured=false,noShootingFixture=null,noShootingChoice=null,noShootingConfigured=false,eighthUpgradeChoice=null,eighthUpgradeConfigured=false,growthChoice=null,growthConfigured=false,doubleArtifactChoice=null,doubleArtifactsConfigured=false,artifactLanguage=null,enabled=true,originURL=origin,settings,difficulty,poor=false,expectedDialog,scriptProgram,...options}={}){
 const classic=['classic','classic-context'].includes(process.env.CASES);
 const desktop=['prompt-desktop','town-resurrection-desktop','classic-context'].includes(process.env.CASES)||process.env.GROWTH_DESKTOP==='1';
 // The packaged site's policy whitelists production domains, not localhost.
 page=await browser.newPage({viewport:viewport||(classic?{width:1024,height:768}:desktop?{width:1440,height:900}:{width:844,height:390}),hasTouch:!desktop,bypassCSP:true});
 if(classic)await page.addInitScript(()=>window.addEventListener('goonk-state',event=>{window.goonkMobileState=event.detail;}));
 if(artifactLanguage)await page.addInitScript(language=>localStorage.setItem('heroes-goonk.language',language),artifactLanguage);
 await silenceTestAudio(page);
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('console',message=>{fs.appendFileSync(path.join(output,'console.log'),message.text().slice(0,2000)+'\n');if(message.text().includes('Temporary game startup failed'))page._startupFailed=true;});
 const cleanManifest=process.env.GOONK_CLEAN_MANIFEST==='1'?JSON.parse(execFileSync('git',['show','HEAD:mod/tum-era/mod.json'],{encoding:'utf8'})):null;
 const growthDifficulty=growthChoice===null?null:readJsonc('work/vcmi-wasm/config/difficulty.json');
 if(growthDifficulty)for(const rule of Object.values(growthDifficulty.ai))if(rule.resources)for(const key of Object.keys(rule.resources))rule.resources[key]=0;
 if(growthDifficulty&&options.eighthUpgradeFixture?.paid)for(const rule of Object.values(growthDifficulty.human))if(rule.resources)rule.resources.gold=1000000;
 await page.addInitScript(({townBannerFixture,levelArtifactVisitFixture,artifactPoolFixture,levelArtifactsConfigured,fogFixture,fogChoice,fogConfigured,noShootingFixture,noShootingChoice,noShootingConfigured,eighthUpgradeFixture,eighthUpgradeConfigured,enabled,settings,blockFixture,blockActor,forcedBlock,poor,scriptProgram,growthChoice,growthConfigured,growthDifficulty,cleanManifest,doubleArtifactChoice,doubleArtifactsConfigured,artifactLanguage,artifactBackpackCap})=>{
  sessionStorage.setItem('heroes-goonk.storage-failed','true');
  let module;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:value=>{
   module=value;let callMain;
   Object.defineProperty(value,'callMain',{configurable:true,set:fn=>{callMain=fn;},get:()=>function(...args){
    const file='/home/web_user/.local/share/vcmi/Mods/tum-era/mod.json';
    const manifest=cleanManifest?structuredClone(cleanManifest):JSON.parse(value.FS.readFile(file,{encoding:'utf8'}));
    manifest.settings??={};manifest.settings.modules??={};manifest.settings.modules.henchmen=enabled;
    if(artifactBackpackCap!==undefined){manifest.settings.heroes??={};manifest.settings.heroes.backpackSize=artifactBackpackCap;}
    if(artifactLanguage){const dir='/home/web_user/.config/vcmi';value.FS.mkdirTree(dir);value.FS.writeFile(dir+'/settings.json',JSON.stringify({general:{language:artifactLanguage==='fr'?'french':'english'}}));}
    if(doubleArtifactChoice!==null){
     const file='/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/wog-map-rules.json';
     const policy=JSON.parse(value.FS.readFile(file,{encoding:'utf8'}));policy.mapRules??={};policy.mapRules['119']=doubleArtifactsConfigured;
     value.FS.writeFile(file,JSON.stringify(policy));
    }
    if(growthChoice!==null){
     // Starting artifacts are random. Keep unrelated daily army conversions
     // from changing the seven authored growth/experience witnesses.
     const runtimeFile='/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/era-bridge-runtime.json';
     const runtime=JSON.parse(value.FS.readFile(runtimeFile,{encoding:'utf8'}));
     for(const[key,policy]of Object.entries(runtime.artifacts||{})){
      delete policy.dailyConversions;if(!Object.keys(policy).length)delete runtime.artifacts[key];
     }
     value.FS.writeFile(runtimeFile,JSON.stringify(runtime));
     manifest.settings.modules.commanders=false;
     value.FS.writeFile('/config/difficulty.json',JSON.stringify(growthDifficulty));
     manifest.settings.combat??={};manifest.settings.combat.layouts??={};
     const attacker=[36,53,70,87,104,121,19],defender=[20,54,88,122,156,37,71];
     manifest.settings.combat.layouts.default={tacticsAllowed:false,obstaclesAllowed:false,attackerCommander:137,defenderCommander:149,attackerUnits:attacker,defenderUnits:defender,attackerUnitsLoose:Array.from({length:7},()=>attacker),attackerUnitsTight:Array.from({length:7},()=>attacker),defenderUnitsLoose:Array.from({length:7},()=>defender),defenderUnitsTight:Array.from({length:7},()=>defender)};
     const name='config/growth-private-heroes.json';manifest.heroes=[...(manifest.heroes||[]),name];
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/'+name,JSON.stringify({'core:valeska':{army:[{creature:'core:peasant',min:100,max:100}]}}));
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/wog-map-rules.json',JSON.stringify({mapRules:{116:growthConfigured}}));
    }
    if(eighthUpgradeFixture?.paid){
     const artifact='config/eighth-private-upgrade-artifact.json';manifest.artifacts=[...(manifest.artifacts||[]),artifact];
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/'+artifact,JSON.stringify({'core:spellBook':{bonuses:[{type:'SPECIAL_UPGRADE',subtype:'wake-of-gods.level8units:supremeArchangel',addInfo:'tum-era:cherub'}]}}));
     const creature='config/eighth-private-upgrade-price.json';manifest.creatures=[...(manifest.creatures||[]),creature];
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/'+creature,JSON.stringify({'tum-era:cherub':{cost:{wood:0,mercury:0,ore:0,sulfur:0,crystal:0,gems:4,gold:7501,'wake-of-gods.mithril:mithril':0}}}));
    }
    if(eighthUpgradeFixture){
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/wog-map-rules.json',JSON.stringify({mapRules:{116:false,125:eighthUpgradeConfigured}}));
     const name='config/eighth-private-heroes.json';manifest.heroes=[...(manifest.heroes||[]),name];
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/'+name,JSON.stringify({'core:valeska':{army:[{creature:'core:goldDragon',min:100,max:100}]}}));
     const creatures='config/eighth-private-creatures.json';manifest.creatures=[...(manifest.creatures||[]),creatures];
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/'+creatures,JSON.stringify({'core:peasant':{hitPoints:1,attack:0,defense:0,speed:1,damage:{min:0,max:0}}}));
    }
    if(noShootingFixture){
     const root='/home/web_user/.local/share/vcmi/Mods/tum-era/content/';
     manifest.settings.modules.stackExperience=noShootingFixture.experience!==false;
     value.FS.writeFile(root+'config/wog-map-rules.json',JSON.stringify({mapRules:{116:false,125:false,129:noShootingConfigured}}));
     const name='config/no-shooting-private.json';manifest.creatures=[...(manifest.creatures||[]),name];
     const types=['SHOOTER','FREE_SHOOTING','NO_MELEE_PENALTY','NO_DISTANCE_PENALTY','NO_WALL_PENALTY'];
     const stackExperience=types.map(type=>({bonus:{type},values:Array(10).fill(true)}));
     stackExperience.push({bonus:{type:'SHOTS'},values:Array(10).fill(8)},{bonus:{type:'PRIMARY_SKILL',subtype:'defence'},values:Array(10).fill(3)});
     const abilities={privateNoMorale:{type:'NO_MORALE'},privateNoLuck:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'}};
     value.FS.writeFile(root+name,JSON.stringify({'core:archer':{hitPoints:5,attack:0,defense:0,speed:20,damage:{min:100000,max:100000},stackExperience,abilities},'core:peasant':{hitPoints:1,attack:0,defense:0,speed:1,damage:{min:0,max:0},abilities}}));
     if(noShootingFixture.artifact){const art='config/no-shooting-private-artifact.json';manifest.artifacts=[...(manifest.artifacts||[]),art];value.FS.writeFile(root+art,JSON.stringify({'core:spellBook':{bonuses:[{type:'SHOOTER'},{type:'SHOTS',val:3},{type:'NO_DISTANCE_PENALTY'}]}}));}
     const attacker=[19,36,53,70,87,104,121],defender=[155,138,121,104,87,70,53];
     manifest.settings.combat.layouts.default={tacticsAllowed:false,obstaclesAllowed:false,attackerCommander:137,defenderCommander:149,attackerUnits:attacker,defenderUnits:defender,attackerUnitsLoose:Array.from({length:7},()=>attacker),attackerUnitsTight:Array.from({length:7},()=>attacker),defenderUnitsLoose:Array.from({length:7},()=>defender),defenderUnitsTight:Array.from({length:7},()=>defender)};
    }
    if(townBannerFixture)value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/wog-map-rules.json',JSON.stringify({mapRules:{239:!!townBannerFixture.configured,sourceOptions:{234:!!townBannerFixture.banned}}}));
    if(fogFixture){value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/wog-map-rules.json',JSON.stringify({mapRules:{120:fogConfigured}}));}
    if(levelArtifactVisitFixture==='object'){
     const root='/home/web_user/.local/share/vcmi/Mods/tum-era/content/';const name='config/level-artifact-object-private.json';manifest.objects=[...(manifest.objects||[]),name];
     value.FS.writeFile(root+name,JSON.stringify({levelArtifactVisitReward:{name:'Private level reward',handler:'configurable',types:{levelArtifactVisitReward:{name:'Private level reward',visitMode:'hero',selectMode:'selectFirst',showInInfobox:true,rewards:[{limiter:{heroLevel:99},manaPoints:99},{heroExperience:3200,manaPoints:7,removeObject:true}]}}}}));
    }else if(levelArtifactVisitFixture){
     const root='/home/web_user/.local/share/vcmi/Mods/tum-era/content/';const name='config/level-artifact-visit-private.json';manifest.factions=[...(manifest.factions||[]),name];
     const configuration=rewards=>({visitMode:'hero',selectMode:'selectFirst',showInInfobox:true,rewards});
     value.FS.writeFile(root+name,JSON.stringify({'core:castle':{town:{buildings:{special1:{configuration:configuration([{limiter:{heroLevel:99},manaPoints:99},{heroExperience:3200,manaPoints:7}])},special2:{configuration:configuration([{manaPoints:11}])}}}}}));
    }
    if(artifactPoolFixture){
     const root='/home/web_user/.local/share/vcmi/Mods/tum-era/content/';
     value.FS.writeFile(root+'config/wog-map-rules.json',JSON.stringify({mapRules:{126:levelArtifactsConfigured}}));
     const name='config/artifact-pool-private.json';manifest.artifacts=[...(manifest.artifacts||[]),name];
     const patches={};for(const id of ['core:centaurAxe','core:blackshardOfTheDeadKnight','core:greaterGnollsFlail'])patches[id]={class:'TREASURE'};
     if(artifactPoolFixture.minor)patches['core:ogresClubOfHavoc']={class:'MINOR'};
     patches['core:angelicAlliance']={class:'RELIC'};patches['wake-of-gods.level8units:magicWand']={class:'RELIC'};
     value.FS.writeFile(root+name,JSON.stringify(patches));
    }
    if(scriptProgram){
     const directory='/home/web_user/.local/share/vcmi/Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';
     const registry=JSON.parse(value.FS.readFile(directory+'registry.json',{encoding:'utf8'}));
     const entry=registry.programs.find(item=>item.id==='cave-gerfrex');if(!entry)throw Error('Missing private source fixture slot');
     const program=JSON.parse(value.FS.readFile(directory+'cave-gerfrex.json',{encoding:'utf8'}));
     Object.assign(program,scriptProgram);entry.enabled=true;entry.programSha256=scriptProgram.sha256;
     value.FS.writeFile(directory+'cave-gerfrex.json',JSON.stringify(program));value.FS.writeFile(directory+'registry.json',JSON.stringify(registry));
    }
    if(poor){
     const name='config/henchmen-resurrection-private.json';manifest.creatures=[...(manifest.creatures||[]),name];
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/'+name,JSON.stringify({'core:peasant':{cost:{gold:10000000}}}));
    }
    if(blockFixture){
     const name='config/henchmen-block-private.json';manifest.creatures=[...(manifest.creatures||[]),name];
     const abilities={privateNoMorale:{type:'NO_MORALE'},privateNoLuck:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'}};
     const patches={
      'core:peasant':{hitPoints:1000000,speed:20,abilities},
      'core:goblin':{hitPoints:1000000,speed:1,attack:0,defense:0,damage:{min:200,max:200},abilities}
     };
     if(blockActor&&blockActor!=='core:peasant')patches[blockActor]={hitPoints:1000000,speed:20,attack:0,defense:0,damage:{min:1,max:1},abilities};
     value.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/'+name,JSON.stringify(patches));
     if(forcedBlock){
      const file='/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/era-bridge-runtime.json';
      const policies=JSON.parse(value.FS.readFile(file,{encoding:'utf8'}));
      policies.creatures[blockActor].physicalDeflection={modifier:29,values:Array(11).fill(100)};
      value.FS.writeFile(file,JSON.stringify(policies));
     }
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
 },{townBannerFixture:options.townBannerFixture,levelArtifactVisitFixture:options.levelArtifactVisitFixture,artifactPoolFixture:options.artifactPoolFixture,levelArtifactsConfigured,fogFixture:options.fogFixture,fogChoice,fogConfigured,noShootingFixture,noShootingChoice,noShootingConfigured,eighthUpgradeFixture:options.eighthUpgradeFixture,eighthUpgradeConfigured,enabled,settings,blockFixture:!!options.blockFixture,blockActor:options.henchmanType,forcedBlock:!!options.forcedBlock,poor,growthChoice,growthConfigured,growthDifficulty,cleanManifest,doubleArtifactChoice,doubleArtifactsConfigured,artifactLanguage,artifactBackpackCap:options.artifactFixture?.backpackCap,scriptProgram:scriptProgram||(options.scriptTown?townVisitProgram():null)});
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
  if(growthChoice!==null){
   assert((await state()).wogOptions.length>=14);
   const input=page.locator(`input[data-wog-option="13"][value="${growthChoice}"]`);
   await openNativeAccordion(page,'.wog-options',{mouse:desktop});await input.locator('..').scrollIntoViewIfNeeded();await input.locator('..')[desktop?'click':'tap']();
   await wait(value=>goonkMobileState.wogOptions[13]===value,growthChoice);
   await command(109,1,1);await wait(()=>goonkMobileState.wogOptions[1]===1);
  }
  if(noShootingFixture?.experience===false){await command(109,1,0);await wait(()=>goonkMobileState.wogOptions[1]===0);}
  if(townBannerChoice!==null){
   const form=page.locator('.wog-options');await openNativeAccordion(page,'.wog-options',{mouse:desktop});
   const choice=form.locator(`input[data-wog-option="30"][value="${townBannerChoice}"]`).locator('..');await choice.scrollIntoViewIfNeeded();await choice[desktop?'click':'tap']();await wait(value=>goonkMobileState.wogOptions[30]===value,townBannerChoice);
  }
  if(levelArtifactChoice!==null){
   const form=page.locator('.wog-options');await openNativeAccordion(page,'.wog-options',{mouse:desktop});
   const choice=form.locator(`input[data-wog-option="29"][value="${levelArtifactChoice}"]`).locator('..');await choice.scrollIntoViewIfNeeded();await choice[desktop?'click':'tap']();await wait(value=>goonkMobileState.wogOptions[29]===value,levelArtifactChoice);
  }
  if(fogChoice!==null){
   const form=page.locator('.wog-options');await openNativeAccordion(page,'.wog-options',{mouse:desktop});
   const choice=form.locator(`input[data-wog-option="28"][value="${fogChoice}"]`).locator('..');await choice.scrollIntoViewIfNeeded();await choice[desktop?'click':'tap']();await wait(value=>goonkMobileState.wogOptions[28]===value,fogChoice);
  }
  if(noShootingChoice!==null){
   const form=page.locator('.wog-options');await openNativeAccordion(page,'.wog-options',{mouse:desktop});
   const choice=form.locator(`input[data-wog-option="27"][value="${noShootingChoice}"]`).locator('..');await choice.scrollIntoViewIfNeeded();await choice[desktop?'click':'tap']();await wait(value=>goonkMobileState.wogOptions[27]===value,noShootingChoice);
  }
  if(eighthUpgradeChoice!==null){
   const form=page.locator('.wog-options');await openNativeAccordion(page,'.wog-options',{mouse:desktop});
   const choice=form.locator(`input[data-wog-option="26"][value="${eighthUpgradeChoice}"]`).locator('..');await choice.scrollIntoViewIfNeeded();await choice[desktop?'click':'tap']();await wait(value=>goonkMobileState.wogOptions[26]===value,eighthUpgradeChoice);
  }
  if(doubleArtifactChoice!==null){
   assert((await state()).wogOptions.length>=25);
   const input=page.locator(`input[data-wog-option="24"][value="${doubleArtifactChoice}"]`);
   await openNativeAccordion(page,'.wog-options',{mouse:desktop});await input.locator('..').scrollIntoViewIfNeeded();await input.locator('..')[desktop?'click':'tap']();
   await wait(value=>goonkMobileState.wogOptions[24]===value,doubleArtifactChoice);
  }
  if(difficulty!==undefined){await command(25,difficulty);await wait(value=>goonkMobileState.difficulty===value,difficulty);}
  if(classic)await command(22);
  else if(desktop)await page.locator('[data-ui=begin]').click();
  else await page.locator('[data-ui=begin]').tap();
 }
 await wait(kind=>goonkMobileState.mode==='map'&&goonkMobileState.turn||kind&&goonkMobileState.mode==='dialog'&&(kind==='any'||goonkMobileState.dialogKind===kind),expectedDialog);
}

async function sheet(){
 if(['classic','classic-context'].includes(process.env.CASES))await command(55);
 else {const mouse=process.env.CASES==='town-resurrection-desktop'||process.env.GROWTH_DESKTOP==='1';const action=await revealNativeAction(page,'[data-ui=heroes]',{mouse});await action[mouse?'click':'tap']();}
 await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);
 return (await state()).heroWindow;
}
async function approachEnemy(dx=1){
 await page.mouse.move(400,300);await page.waitForTimeout(100);
 await command(6);await page.waitForTimeout(150);
 const target=await page.evaluate(dx=>{const view=goonkMobileState.mapOverview.view;return{x:view.x+view.w/2+32*dx,y:view.y+view.h/2};},dx);
 await page.evaluate(point=>Module._vcmiMobilePointer(point.x,point.y,1),target);
 await wait(()=>goonkMobileState.hasPath);await command(2);
}
async function startBattle(dx=1){
 await approachEnemy(dx);
 await wait(()=>goonkMobileState.mode==='battle'||goonkMobileState.dialogKind==='henchman-offer');
 if((await state()).dialogKind==='henchman-offer')await page.locator('[data-dialog-cancel]').tap();
 await wait(()=>goonkMobileState.mode==='battle');
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
 if(process.env.CASES==='temporary-battle-army'){
  const {runTemporaryBattleArmy}=await import('./wog-temporary-battle-army-cases.mjs');
  await runTemporaryBattleArmy({boot,sheet,state,command,wait,page:()=>page,report,output,
   save:()=>readCompletedNativeSave(page,command,{tag:952})});
 }
 if(process.env.CASES==='artifact-native-assembly'){
  const {runNativeAssembly}=await import('./wog-source-artifact-native-assembly-cases.mjs');
  await runNativeAssembly({boot,state,command,wait,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='artifact-grant-capacity'){
  const {runArtifactCapacity}=await import('./wog-source-artifact-capacity-cases.mjs');
  await runArtifactCapacity({boot,state,command,wait,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='level-artifact-visit'){
  const {runLevelArtifactVisit}=await import('./wog-map-level-artifact-visit-cases.mjs');
  await runLevelArtifactVisit({boot,sheet,state,command,wait,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='town-banners'){
  const {runTownBanners}=await import('./wog-town-banner-cases.mjs');
  await runTownBanners({boot,sheet,state,command,wait,resolve,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='level-artifacts'){
  const {runLevelArtifacts}=await import('./wog-map-level-artifact-cases.mjs');
  await runLevelArtifacts({boot,sheet,state,command,wait,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='artifact-grants'){
  const {runArtifactGrants}=await import('./wog-source-artifact-grant-cases.mjs');
  await runArtifactGrants({boot,sheet,state,command,wait,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='artifact-pool'){
  const {runArtifactPool}=await import('./wog-source-artifact-pool-cases.mjs');
  await runArtifactPool({boot,state,command,wait,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='darkness'){
  const {runDarkness}=await import('./wog-map-darkness-cases.mjs');
  await runDarkness({boot,state,command,wait,approachEnemy,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='no-shooting'){
  const {runNoShooting}=await import('./wog-map-no-shooting-cases.mjs');
  await runNoShooting({boot,sheet,state,command,wait,approachEnemy,resolve,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='eighth-upgrades'){
  const {runEighthUpgrades}=await import('./wog-map-eighth-upgrades-cases.mjs');
  await runEighthUpgrades({boot,sheet,state,command,wait,approachEnemy,resolve,page:()=>page,report,output,readCompletedNativeSave});
 }
 if(process.env.CASES==='double-artifacts'){
  const {runDoubleArtifacts}=await import('./wog-map-double-artifacts-cases.mjs');
  await runDoubleArtifacts({boot,sheet,state,command,wait,approachEnemy,resolve,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:961})});
 }
 if(process.env.CASES==='tile-properties'){
  const {runTileProperties}=await import('./wog-era-tile-properties-cases.mjs');
  await runTileProperties({boot,state,command,wait,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:960})});
 }
 if(process.env.CASES==='random-ranges'){
  const {runRandomRanges}=await import('./wog-era3-random-ranges-cases.mjs');
  await runRandomRanges({boot,state,wait,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:951})});
 }
 if(process.env.CASES==='string-receivers'){
  const {runStringReceivers}=await import('./wog-era3-string-receivers-cases.mjs');
  await runStringReceivers({boot,state,wait,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:950})});
 }
 if(process.env.CASES==='quick-scope'){
  const {runQuickScope}=await import('./wog-era3-quick-scope-cases.mjs');
  await runQuickScope({boot,state,wait,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:949})});
 }
 if(process.env.CASES==='string-locals'){
  const {runStringLocals}=await import('./wog-era3-string-locals-cases.mjs');
  await runStringLocals({boot,state,wait,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:948})});
 }
 if(process.env.CASES==='function-metadata'){
  const {runFunctionMetadata}=await import('./wog-era3-function-metadata-cases.mjs');
  await runFunctionMetadata({boot,state,wait,page:()=>page,command,save:()=>readCompletedNativeSave(page,command,{tag:946}),report,output});
 }
 if(process.env.CASES==='legacy-numeric-calls'){
  const {runLegacyNumericCallsControl}=await import('./wog-era3-numeric-calls-fixture.mjs');
  await runLegacyNumericCallsControl({boot,state,wait,page:()=>page,report,output});
 }
 if(process.env.CASES==='advanced-core'){
  const {runAdvancedCore}=await import('./wog-advanced-core-cases.mjs');
  await runAdvancedCore({boot,state,wait,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:943})});
 }
 if(process.env.CASES==='advanced-class-identity'){
  const {runAdvancedClassIdentity}=await import('./wog-advanced-class-identity-cases.mjs');
  await runAdvancedClassIdentity({boot,state,wait,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:942})});
 }
 if(process.env.CASES==='advanced-class-points'){
  const {runAdvancedClassPoints}=await import('./wog-advanced-class-points-cases.mjs');
  await runAdvancedClassPoints({boot,state,command,wait,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:941})});
 }
 if(process.env.CASES==='army-growth'){
  const {runArmyGrowth}=await import('./wog-map-army-growth-cases.mjs');
  await runArmyGrowth({boot,sheet,state,command,wait,approachEnemy,resolve,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:940})});
 }
 if(process.env.CASES==='battle-outcomes'){
  const {runBattleOutcomes}=await import('./wog-henchmen-battle-outcomes-cases.mjs');
  await runBattleOutcomes({boot,sheet,state,command,wait,startBattle,resolve,page:()=>page,report,output,save:()=>readCompletedNativeSave(page,command,{tag:945})});
 }
 if(process.env.CASES==='signed-hero-experience'){
  const {runSignedExperience}=await import('./wog-henchmen-signed-experience-cases.mjs');
  await runSignedExperience({boot,sheet,command,wait,startBattle,resolve,page:()=>page,report,output,
   save:()=>readCompletedNativeSave(page,command,{tag:938})});
 }
 if(process.env.CASES==='battle-start-experience'){
  const {runBattleStartExperience}=await import('./wog-henchmen-battle-experience-cases.mjs');
  await runBattleStartExperience({boot,sheet,state,command,wait,startBattle,resolve,page:()=>page,report,output,
   save:()=>readCompletedNativeSave(page,command,{tag:939})});
 }
 if(process.env.CASES==='zero-hero-experience'){
  for(const campaignTransfer of [false,true]){
   await boot({heroLevelLimit:1,henchmanType:'core:archangel',settings:{campaignTransfer,battleExpStatic:100,battleExpRandom:0,battleHeroExpCoef:0,battleExpPerHeroLv:0,battleExpMin:0,battleExpMax:1000,bonusDaily:0,bonusHeroLvUp:0,stackExpEnabled:false}});
   const before=await sheet();assert.equal(before.experience,0);assert(before.henchman.alive);
   await command(63);await wait(()=>goonkMobileState.mode==='map');await startBattle();await resolve();
   const after=await sheet();assert(after.henchman.alive);assert.equal(after.experience,0,'Authored map level cap prevents hero XP');
   assert.equal(after.henchman.experience-before.henchman.experience,campaignTransfer?0:100,'Source skips zero-gain rewards only when campaignTransfer is enabled');
   await command(63);await wait(()=>goonkMobileState.mode==='map');const bytes=[...await readCompletedNativeSave(page,command,{tag:937})];
   await page.close();await boot({save:bytes});const restored=await sheet();assert.equal(restored.henchman.experience,after.henchman.experience);
   report.scenarios.push({heroAtLevelCap:true,campaignTransfer,heroExperience:0,companionReward:campaignTransfer?0:100,nativeSaveReload:true});await page.close();
  }
 }
 if(process.env.CASES==='ai-no-actor'){
  const {runAINoActor}=await import('./wog-henchmen-ai-no-actor-cases.mjs');
  await runAINoActor({boot,sheet,state,command,wait,startBattle,resolve,page:()=>page,report,output,
   save:()=>readCompletedNativeSave(page,command,{tag:959})});
 }
 if(process.env.CASES==='ai-shared-reward'){
  const {runAISharedReward}=await import('./wog-henchmen-ai-reward-cases.mjs');
  await runAISharedReward({boot,sheet,state,command,wait,startBattle,resolve,page:()=>page,report,output,
   save:()=>readCompletedNativeSave(page,command,{tag:938})});
 }
 if(['town-resurrection','town-resurrection-desktop','town-resurrection-ai','town-resurrection-foreign','town-resurrection-scripted'].includes(process.env.CASES)){
  const {runTownResurrection}=await import('./wog-henchmen-town-resurrection-cases.mjs');
  await runTownResurrection({boot,sheet,state,command,wait,approachEnemy,page:()=>page,report,output,
   desktop:process.env.CASES==='town-resurrection-desktop',save:()=>readCompletedNativeSave(page,command,{tag:936})});
 }
 if(['prompt','prompt-desktop'].includes(process.env.CASES)){
  const {runHenchmanPrompts}=await import('./wog-henchmen-prompt-cases.mjs');
  await runHenchmanPrompts({boot,approachEnemy,state,command,wait,resolve,page:()=>page,report,output,
   desktop:process.env.CASES==='prompt-desktop',save:()=>readCompletedNativeSave(page,command,{tag:935})});
 }
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
 if(['banner-block','banner-overlap','banner-overlap-forced'].includes(process.env.CASES)){
  const {runBannerBlock}=await import('./wog-henchmen-banner-block-cases.mjs');
  await runBannerBlock({boot,startBattle,state,command,wait,page:()=>page,report,output,overlap:process.env.CASES!=='banner-block',forced:process.env.CASES==='banner-overlap-forced'});
 }
 if(process.env.CASES==='module-save'){
  for(const enabled of [true,false]){
   await boot({enabled});let hero=await sheet();assert.equal(!!hero.henchman,enabled);
   if(enabled){await selectHeroTab(page,'henchman');await page.locator('[data-henchman-slot="0"]').tap();await wait(()=>goonkMobileState.heroWindow?.henchman?.unit);}
   await command(63);await wait(()=>goonkMobileState.mode==='map');
   const save=await readCompletedNativeSave(page,command,{tag:enabled?931:932});await page.close();
   await boot({save:[...save],enabled:!enabled});hero=await sheet();assert.equal(!!hero.henchman,enabled);
   if(enabled)assert.equal(hero.henchman.unit?.key,'core:peasant');
   report.scenarios.push(enabled?'companion-enabled-choice-and-unit-survive-disabled-installation-default':'companion-disabled-choice-survives-enabled-installation-default');await page.close();
  }
  if(process.env.HENCH_LEGACY_ORIGIN){
   await boot({enabled:true,originURL:process.env.HENCH_LEGACY_ORIGIN});await sheet();
   await selectHeroTab(page,'henchman');await page.locator('[data-henchman-slot="0"]').tap();
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
 if(['classic','classic-context'].includes(process.env.CASES)){
  await boot({bannerInventory:true});await sheet();
  const flag=async(right=false)=>{
   const previous=await state(),r=previous.rect;
   if(right){
    const point=await page.evaluate(({x,y})=>{const box=Module.canvas.getBoundingClientRect();return{x:box.x+x*box.width/Module.canvas.width,y:box.y+y*box.height/Module.canvas.height};},{x:r.x+635,y:r.y+40});
    await page.mouse.click(point.x,point.y,{button:'right'});
   }else await page.evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),{x:r.x+635,y:r.y+40});
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
  if(process.env.CASES==='classic-context'){
   await flag(true);await row(1);await row(5);
   await wait(()=>goonkMobileState.heroWindow?.henchman?.bannerStyle===5);
   report.scenarios.push('desktop-right-click-opens-native-companion-menu-and-changes-banner-without-Ctrl');
   await flag(true);await row(2);await wait(()=>goonkMobileState.heroWindow?.henchman?.bannerStyle===-1);
   await command(62,19);await wait(()=>goonkMobileState.heroWindow?.picked);
   const before=await state(),r=before.rect;
   const point=await page.evaluate(({x,y})=>{const box=Module.canvas.getBoundingClientRect();return{x:box.x+x*box.width/Module.canvas.width,y:box.y+y*box.height/Module.canvas.height};},{x:r.x+635,y:r.y+40});
   await page.mouse.click(point.x,point.y,{button:'right'});await page.waitForTimeout(200);
   const after=await state();assert.equal(after.windowToken,before.windowToken);assert(after.heroWindow.picked);
   assert.equal(after.heroWindow.henchman.bannerStyle,-1);await command(64);
   report.scenarios.push('right-click-with-a-held-artifact-does-not-equip-or-consume-it');
  }
  await page.close();
 }
 if(process.env.CASES==='held-banner'){
  await boot({dead:true,bannerInventory:true,settings:{reviveAnywhere:true}});
  let hero=await sheet();assert(!hero.henchman.alive);assert(!hero.henchman.canEquipBanner);
  await command(62,19);await wait(()=>goonkMobileState.heroWindow?.picked);
  hero=(await state()).heroWindow;assert(hero.henchman.canEquipHeldBanner);
  await selectHeroTab(page,'henchman');
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
  await selectHeroTab(page,'henchman');
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
  await selectHeroTab(page,'henchman');
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
 await selectHeroTab(page,'henchman');
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
 await selectHeroTab(page,'henchman');
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
 await selectHeroTab(page,'henchman');
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
  await selectHeroTab(page,'henchman');await page.locator('[data-henchman-slot="1"]').tap();
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
 await selectHeroTab(page,'henchman');assert.match(await page.locator('.henchman-sheet').innerText(),/50\s*%/);
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
 assert.equal(hero.henchman.rank,0);await selectHeroTab(page,'henchman');
 await page.locator('[data-henchman-slot="1"]').tap();await wait(()=>goonkMobileState.heroWindow?.henchman?.unit?.key==='core:archangel');
 hero=(await state()).heroWindow;
 assert.equal(hero.henchman.experience,experience-Math.trunc(experience*50/100));
 assert(!hero.henchman.candidates.some(unit=>unit.key==='wake-of-gods.creatures:santaGremlin'));
 report.scenarios.push('replacement-loss-and-no-return-options');await page.close();
 await boot({dead:true,settings:{reviveAnywhere:true}});hero=await sheet();assert(hero.henchman.canResurrect);
 const gold=(await state()).resources[6],cost=hero.henchman.resurrectionCost;
 await selectHeroTab(page,'henchman');await page.locator('[data-henchman-action="2"]').tap();
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
