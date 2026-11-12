import {chromium} from 'playwright-core';import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
// All fixture edits live only in each isolated browser's in-memory filesystem.
const fixture=execFileSync('python3',['-c',`import zipfile,io,json,sys
with zipfile.ZipFile('../../maps/000-Goonk.vmap') as z:
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as result:
  for name in z.namelist():
   data=z.read(name)
   if name=='objects.json':
    objects=json.loads(data)
    for obj in objects:
     if obj.get('instanceName')=='goonkHero':obj['options']['army']=[{'type':'tum-era:redBonesDragon','amount':1}]
     if obj.get('instanceName')=='trainingGuard':obj['subtype']='core:skeletonWarrior';obj['options']['amount']=40
    data=json.dumps(objects).encode()
   result.writestr(name,data)
 sys.stdout.buffer.write(out.getvalue())`]);
const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9224'),report={cases:[]};
for(const chancePercent of [0,100]){
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),result={chancePercent,errors:[],turns:[]};page.on('pageerror',e=>result.errors.push(e.message));
 const wait=f=>page.waitForFunction(f,null,{timeout:240000}),click=name=>page.getByRole('button',{name,exact:true}).click();
 try{
  // Disable the optional commander through the same preset consumed by VCMI,
  // before native main starts. This keeps the fixture to its declared army.
  await page.addInitScript(()=>{
   let current;
   Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:module=>{
    current=module;let nativeMain;
    Object.defineProperty(module,'callMain',{configurable:true,set:value=>{nativeMain=value;},get:()=>function(...args){
     const file='/home/web_user/.config/vcmi/modSettings.json',settings=JSON.parse(module.FS.readFile(file,{encoding:'utf8'})),preset=settings.presets[settings.activePreset||'default'];
     preset.settings ||= {};preset.settings['wake-of-gods'] ||= {};preset.settings['wake-of-gods'].commanders=false;module.FS.writeFile(file,JSON.stringify(settings));return nativeMain.apply(module,args);
    }});
   }});
  });
  await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto((process.env.GAME_ORIGIN||'http://127.0.0.1:8772')+'/?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu');assert.equal(await page.evaluate(()=>Module._vcmiEraBridgeVersion()),2);
  await page.evaluate(({map,chancePercent})=>{Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/000-Goonk.vmap',Uint8Array.from(atob(map),c=>c.charCodeAt(0)));Module.FS.writeFile('/home/web_user/.local/share/vcmi/Mods/tum-era/content/config/era-bridge-runtime.json',JSON.stringify({schemaVersion:1,creatures:{'tum-era:redBonesDragon':{regeneration:{hitPoints:50,chancePercent}}}}));},{map:fixture.toString('base64'),chancePercent});
  await click('Nouvelle aventure');await wait(()=>goonkMobileState.maps?.length);const map=(await page.evaluate(()=>goonkMobileState.maps)).find(m=>m.name.includes('Château Goonk'));assert(map);await page.locator('#mobile-map-select').selectOption(String(map.index));await page.waitForFunction(name=>goonkMobileState.selectedMap===name,map.name);await click('Commencer');await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);await page.evaluate(()=>Module._vcmiMobilePointer(433,281,1));await wait(()=>goonkMobileState.hasPath);await click('➤ Marcher');await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);
  let observed;
  for(let turn=0;turn<12;turn++){
   await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&goonkMobileState.activeUnit?.name==='Red Bones Dragon');
   const snapshot=await page.evaluate(()=>({round:goonkMobileState.round,dragon:goonkMobileState.battleUnits.find(u=>u.name==='Red Bones Dragon'),enemy:{count:goonkMobileState.battleUnits.filter(u=>u.enemy).reduce((sum,u)=>sum+u.count,0),stacks:goonkMobileState.battleUnits.filter(u=>u.enemy).map(u=>({count:u.count,stackId:u.stackId}))}}));result.turns.push(snapshot);if(turn===0)assert.equal(snapshot.enemy.count,40,'The isolated fixture must contain forty skeletons across its native stacks');assert.equal(snapshot.dragon.count,1);assert.equal(snapshot.dragon.maximumHealth,400);
   if(snapshot.enemy?.count<40){observed=snapshot;break;}
   const round=snapshot.round;await click('⛨ Défendre');await page.waitForFunction(round=>goonkMobileState.round>round||goonkMobileState.mode!=='battle',round,{timeout:30000});
  }
  assert(observed,'The skeletons must hit the dragon and suffer its retaliation');assert(observed.enemy.count>0,'The battle must still be running');
  if(chancePercent===0)assert(observed.dragon.currentHealth<400,'A disabled ERA policy must suppress the native unconditional regeneration');
  else assert.equal(observed.dragon.currentHealth,400,'The native ERA policy must restore the damaged first creature');
  result.observed=observed;assert.deepEqual(result.errors,[]);console.log(JSON.stringify({chancePercent,round:observed.round,health:{current:observed.dragon.currentHealth,maximum:observed.dragon.maximumHealth}}));
 }catch(error){result.failure=error.stack;process.exitCode=1;console.error(error.stack);await page.screenshot({path:'../../outputs/era-regeneration-'+chancePercent+'-failure.png'});}
 finally{report.cases.push(result);await context.close();}
}
fs.writeFileSync('../../outputs/era-regeneration-native-e2e.json',JSON.stringify(report,null,2));await browser.close();
