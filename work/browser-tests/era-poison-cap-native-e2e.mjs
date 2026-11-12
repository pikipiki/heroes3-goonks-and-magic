import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
if(!process.argv[2])throw Error('Usage: node status-health-native-e2e.mjs PROJECT_ROOT [REPORT]');
const project=path.resolve(process.argv[2]),reportFile=path.resolve(process.argv[3]??'/tmp/tum-poison-cap-native-e2e.json'),require=createRequire(project+'/work/browser-tests/package.json'),{chromium}=require('playwright-core');
const map=execFileSync('python3',['-c',`import zipfile,io,json,sys
with zipfile.ZipFile(sys.argv[1]) as z:
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as result:
  for name in z.namelist():
   data=z.read(name)
   if name=='objects.json':
    objects=json.loads(data)
    for obj in objects:
     if obj.get('instanceName')=='goonkHero':obj['options']['army']=[{'type':'tum-era:redBonesDragon','amount':1}]
     if obj.get('instanceName')=='trainingGuard':obj['subtype']='core:pikeman';obj['options']['amount']=70
    data=json.dumps(objects).encode()
   result.writestr(name,data)
 sys.stdout.buffer.write(out.getvalue())`,project+'/maps/000-Goonk.vmap']).toString('base64');
const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9224'),report={executed:true,cases:[]};
const cases=[{name:'poisonRefreshCap50',flat:0,poison:true,max:91,first:90,base:101}];
for(const scenario of cases){const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),result={...scenario,errors:[],snapshots:[]};page.on('pageerror',e=>result.errors.push(e.message));const wait=(fn,arg)=>page.waitForFunction(fn,arg,{timeout:240000}),click=n=>page.getByRole('button',{name:n,exact:true}).click();
 try{
  await page.addInitScript(({scenario,map})=>{let current;Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:module=>{current=module;let main;Object.defineProperty(module,'callMain',{configurable:true,set:v=>main=v,get:()=>function(...args){const settingsFile='/home/web_user/.config/vcmi/modSettings.json',settings=JSON.parse(module.FS.readFile(settingsFile,{encoding:'utf8'})),preset=settings.presets[settings.activePreset||'default'];preset.settings||={};preset.settings['wake-of-gods']||={};preset.settings['wake-of-gods'].commanders=false;module.FS.writeFile(settingsFile,JSON.stringify(settings));const root='/home/web_user/.local/share/vcmi/';module.FS.writeFile(root+'Maps/000-Goonk.vmap',Uint8Array.from(atob(map),c=>c.charCodeAt(0)));module.FS.writeFile(root+'Mods/tum-era/content/config/era-bridge-status-health.json',JSON.stringify({schemaVersion:1,enabled:true}));module.FS.writeFile(root+'Mods/tum-era/content/config/era-bridge-runtime.json',JSON.stringify({schemaVersion:1,creatures:{}}));const file=root+'Mods/tum-era/content/config/red-bones-dragon.json',json=JSON.parse(module.FS.readFile(file,{encoding:'utf8'}));json.redBonesDragon={...json.redBonesDragon,hitPoints:10000,speed:99,attack:0,defense:99,damage:{min:1,max:1},abilities:{flying:{type:'FLYING'},noMorale:{type:'NO_MORALE'},luckMin:{type:'LUCK',val:0,valueType:'INDEPENDENT_MIN'},luckMax:{type:'LUCK',val:0,valueType:'INDEPENDENT_MAX'},noRetaliation:{type:'BLOCKS_RETALIATION'},noCounter:{type:'ADDITIONAL_RETALIATION',val:-1},...(scenario.poison?{poison:{type:'SPELL_AFTER_ATTACK',subtype:'core:poison',val:100}}:{})}};json['core:pikeman']={hitPoints:101,speed:1,attack:0,defense:1000,damage:{min:1,max:1},abilities:{noMorale:{type:'NO_MORALE'},...(scenario.flat?{fixtureFlatHP:{type:'STACK_HEALTH',val:scenario.flat,valueType:'ADDITIVE_VALUE'}}:{})}};module.FS.writeFile(file,JSON.stringify(json));return main.apply(module,args);}});}});},{scenario,map});
  await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto((process.env.GAME_ORIGIN||'http://127.0.0.1:8774')+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu');await click('Nouvelle aventure');await wait(()=>goonkMobileState.maps?.length);const selected=(await page.evaluate(()=>goonkMobileState.maps)).find(m=>m.name.includes('Château Goonk'));assert(selected);await page.locator('#mobile-map-select').selectOption(String(selected.index));await wait(n=>goonkMobileState.selectedMap===n,selected.name);await click('Commencer');await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);await page.evaluate(()=>Module._vcmiMobilePointer(433,281,1));await wait(()=>goonkMobileState.hasPath);await click('➤ Marcher');await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&!goonkMobileState.activeUnit?.enemy);
  const target=await page.evaluate(()=>goonkMobileState.battleUnits.find(u=>u.enemy));assert.equal(target.maximumHealth,scenario.base);const initialCount=target.count;
  await page.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},target);
  await wait(({id,max})=>goonkMobileState.battleUnits?.find(u=>u.stackId===id)?.maximumHealth===max,{id:target.stackId,max:scenario.max});
  const after=await page.evaluate(id=>({round:goonkMobileState.round,unit:goonkMobileState.battleUnits.find(u=>u.stackId===id)}),target.stackId);result.after=after;assert.equal(after.unit.maximumHealth,scenario.max);assert.equal(after.unit.currentHealth,scenario.first,'Top creature keeps the one physical wound, rather than retaining old firstHPleft');assert.equal(after.unit.count,initialCount);
  for(let round=2;round<=8;round++){
   const previous=await page.evaluate(()=>goonkMobileState.round);
   await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.activeUnit?.name==='Red Bones Dragon');
   const snap=await page.evaluate(id=>({round:goonkMobileState.round,unit:goonkMobileState.battleUnits.find(u=>u.stackId===id)}),target.stackId);result.snapshots.push(snap);
   assert.equal(snap.round,round);
   const max=round<=5?[0,0,81,71,61,51][round]:round<8?51:101;
   assert.equal(snap.unit.maximumHealth,max,'Poison advances globally, caps at50%, expires three rounds after last refresh');
   assert.equal(snap.unit.count,initialCount);
   assert.equal(snap.unit.currentHealth,max-Math.min(round-1,5),'Source keeps physical wounds across each health change');
   if(round<=5){await page.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},snap.unit);await wait(r=>goonkMobileState.round>r||!goonkMobileState.canAct,round);}else if(round<8){await click('⛨ Défendre');await wait(r=>goonkMobileState.round>r,round);}
  }
  assert.deepEqual(result.errors,[]);result.passed=true;console.log(JSON.stringify({name:scenario.name,passed:true,after,expiration:result.snapshots.at(-1)}));
 }catch(error){result.failure=error.stack;process.exitCode=1;result.state=await page.evaluate(()=>window.goonkMobileState).catch(()=>null);result.log=await page.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).slice(-15000)}catch{return''}}).catch(()=>null);console.error(error.stack);}
 finally{report.cases.push(result);fs.writeFileSync(reportFile,JSON.stringify(report,null,2));await context.close();}
}
await browser.close();
