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
for(const group of Object.values(testDifficulty))for(const rule of Object.values(group))if(rule.resources)rule.resources.mithril=100;
let page;
const wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
const state=()=>page.evaluate(()=>goonkMobileState);
const command=(...values)=>page.evaluate(values=>Module._vcmiMobileCommand(...values,...Array(6-values.length).fill(0)),values);

function fixture({reroll=null}={}){
 return execFileSync('python3',['-c',String.raw`
import zipfile,json,io,sys,importlib.util
opts=json.loads(sys.argv[1])
with zipfile.ZipFile('maps/000-Goonk.vmap') as archive: entries={n:archive.read(n) for n in archive.namelist()}
objects=[o for o in json.loads(entries['objects.json']) if o['instanceName'] in ['goonkHero','goonkTown','enemyTown']]
for o in objects:
 if o['instanceName']=='goonkHero':
  o['options'].update({'type':'core:christian','experience':0,'army':[{'type':'core:archangel','amount':10}],'artifacts':{'spellbook':'core:spellBook'}})
  if opts['reroll']=='university': o['options']['secondarySkills']={'core:wisdom':'basic'}
def site(name,kind,subtype,x,y,owner=None):
 o={'type':'core:'+kind,'subtype':'core:'+subtype,'instanceName':name,'x':x,'y':y,'l':0,'template':{'animation':'AVWpeas.def','mask':['A'],'visitableFrom':['+++','+-+','+++']},'options':{}}
 if owner:o['options']['owner']=owner
 objects.append(o)
site('mithrilGold','mine','goldMine',12,11,'red')
site('mithrilOre','mine','orePit',13,11,'red')
site('mithrilEnemy','mine','goldMine',14,11,'blue')
site('mithrilDwelling','creatureGeneratorCommon','guardhouse',12,12,'red')
if opts['reroll']=='shrine':
 site('mithrilShrine','shrineOfMagicLevel1','shrineOfMagicLevel1',10,11)
 objects[-1]['options']['rewardable']={'variables':{'preset':{'spell@gainedSpell':'core:bless'}}}
elif opts['reroll']=='hut':
 site('mithrilHut','witchHut','witchHut',10,11)
 objects[-1]['options']['rewardable']={'variables':{'preset':{'secondarySkill@gainedSkill':'core:offense'}}}
elif opts['reroll']=='university': site('mithrilAdvancedUniversity','university','object',9,11)
elif opts['reroll']=='payout': site('mithrilPayout','waterWheel','waterWheel',9,11)
elif opts['reroll']=='conflux': site('mithrilConflux','creatureGeneratorSpecial','elementalConflux',9,11,'red')
else: site('mithrilMill','windmill','windmill',10,11)
site('mithrilWheel','waterWheel','waterWheel',8,11)
site('mithrilUniversity','university','object',8,12)
site('mithrilShipyard','shipyard','object',13,13,'red')
site('mithrilPortal','monolithOneWayEntrance','monolith1',8,10)
site('mithrilPortalExit','monolithOneWayExit','monolith1',16,16)
entries['objects.json']=json.dumps(objects).encode()
terrain=json.loads(entries['surface_terrain.json'])
for y,row in enumerate(terrain):
 for x in range(len(row)):
  if 20<=x<=22 or 20<=y<=22: row[x]='rc0_'
entries['surface_terrain.json']=json.dumps(terrain).encode()
header=json.loads(entries['header.json']);header['name']='000 - Mithril native validation';entries['header.json']=json.dumps(header).encode()
for name in ['english.json','french.json']:
 text=json.loads(entries[name]);text['mapName']='000 - Mithril native validation';entries[name]=json.dumps(text).encode()
spec=importlib.util.spec_from_file_location('normalize','scripts/normalize-map-instances.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);entries=mod.normalize(entries)
out=io.BytesIO()
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as archive:
 for name,data in entries.items():archive.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())
`,JSON.stringify({reroll})]);
}

async function boot({save,enabled=true,henchmen=false,funds=100,preserveRewards=false,...options}={}){
 page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
 await silenceTestAudio(page);
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('console',message=>{fs.appendFileSync(path.join(output,'console.log'),message.text().slice(0,2000)+'\n');if(message.text().includes('Temporary game startup failed'))page._startupFailed=true;});
 const difficulty=structuredClone(testDifficulty);
 for(const group of Object.values(difficulty))for(const rule of Object.values(group))if(rule.resources)rule.resources.mithril=funds;
 const markets=options.reroll==='university'?structuredClone(testMarkets):null;
 if(markets)markets.university.types.object.offer={wisdom:1,airMagic:1,earthMagic:1,fireMagic:1};
 const shrines=preserveRewards?structuredClone(testShrines):null;
 if(shrines)shrines.shrineOfMagicLevel1.types.shrineOfMagicLevel1.rewards[0].resources={gold:{min:1001,max:9999}};
 await page.addInitScript(({enabled,henchmen,difficulty,markets,shrines})=>{
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
    value.FS.writeFile(file,JSON.stringify(manifest));
    try{return callMain.apply(value,args);}catch(error){window.goonkEngineStartupError=String(error)+' root='+JSON.stringify(value.FS.readdir('/'))+' cwd='+value.FS.cwd();throw error;}
   }});
  }});
 },{enabled,henchmen,difficulty,markets,shrines});
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
 await page.locator('[data-mithril-close]').tap();
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
  await boot({reroll:kind});
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
   await wait(()=>goonkMobileState.mode==='dialog'&&JSON.stringify(goonkMobileState.dialogPresentation||{}).includes('3000'));await command(1);
   await wait(before=>goonkMobileState.mode==='map'&&goonkMobileState.resources[6]===before-3000,before);
   await page.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.heroWindow);
   const skills=(await state()).heroWindow.skills;assert(skills.some(row=>/wisdom/i.test(row.name)&&/advanced/i.test(row.mastery)),JSON.stringify(skills));
   report.scenarios.push('advanced-university-post-visit-skill-and-3000-gold');await page.close();continue;
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
