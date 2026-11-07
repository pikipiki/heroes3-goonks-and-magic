import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

for(const [kind,launcher] of Object.entries({chromium,webkit})){
 const browser=await launcher.launch(kind==='webkit'?{executablePath:process.env.WEBKIT_PATH}:{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/web/**',route=>{
   const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);
   return fs.existsSync(file)?route.fulfill({path:file}):route.abort();
  });
  await page.route('**/build-direct-test?mobile=1',route=>route.fulfill({contentType:'text/html',body:`<!doctype html>
   <meta name=viewport content="width=device-width,initial-scale=1">
   <link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css>
   <canvas id=canvas width=800 height=600></canvas>
   <script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script>
   <script type=module src=/web/mobile.mjs></script>`}));
  await page.goto('http://127.0.0.1:8783/build-direct-test?mobile=1');
  await page.waitForSelector('#mobile-app');
  const button=ui=>page.locator('[data-ui="'+ui+'"]:visible').first();
  const card=id=>page.locator('.mobile-sheet:not([hidden]) [data-building-id="'+id+'"]');
  const tab=name=>page.locator('[data-building-tab="'+name+'"]');
  const commands=()=>page.evaluate(()=>calls.map(args=>args.slice(0,2)));
  const returnFromInspection=async()=>{
   await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...buildState,mode:'dialog'}})));
   await page.waitForFunction(()=>goonkMobileState.mode==='dialog');
   await page.evaluate(()=>sendBuild());
   await page.waitForFunction(()=>goonkMobileState.mode==='town');
  };
  for(const faction of ['core:tower','goonk:goonk'])for(const size of [{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);
   await page.evaluate(faction=>{
    window.calls=[];
    window.buildState={mode:'town',townFaction:faction,townName:'Town',turn:false,armies:[],resources:[30,15,30,15,15,15,20000],buildings:[
     {id:16,key:'core:blacksmith',name:'{Blacksmith}',description:'War machines',built:true,allowed:false,state:4},
     {id:17,key:'core:extraCityHall',name:'{}',description:' ',built:true,allowed:false,state:4},
     {id:18,key:'core:warMachineUpgrade',name:'Blacksmith',description:'Upgraded war machines.',built:true,allowed:false,state:4},
     {id:0,key:'core:mageGuild1',name:'Mage guild',description:'Learn spells',built:false,allowed:true,cost:[0,0,0,0,0,0,2000]},
     {id:5,key:'core:tavern',name:'Tavern',built:false,allowed:false,state:2,cost:[5,0,0,0,0,0,500]},
     {id:31,key:'core:dwellingUpLvl1',name:'{Adv. Goblin Barracks}',description:'Recruit {Hobgoblin Overlords}.',built:false,allowed:false,state:8,cost:[]},
    ]};
    window.sendBuild=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(buildState)}));
    sendBuild();
   },faction);
   await page.waitForFunction(()=>window.goonkMobileState?.mode==='town'&&!goonkMobileState.turn);
   assert.equal(await page.locator('[data-ui=town-buildings]').count(),0);
   if(size.width<size.height){
    assert.equal(await page.locator('[data-town-building="16"]').getAttribute('aria-label'),'Blacksmith');
    await page.locator('[data-town-building="16"]').tap();
    assert.deepEqual(await commands(),[[39,16]],'Direct inspection works during the opponent’s turn');
    await returnFromInspection();
   }
   if(faction==='core:tower'){
    await page.waitForFunction(()=>performance.getEntriesByType('resource').some(entry=>entry.name.endsWith('/tower/structures/mageGuild1.webp')));
   }
   await button('build').tap();
   assert.equal(await tab('unbuilt').getAttribute('aria-pressed'),'true');
   assert.match(await card(0).innerText(),/Mage guild.*Learn spells/s);
   assert.notEqual(await card(0).locator('.building-card-image').getAttribute('loading'),'lazy');
   assert.equal(await card(31).locator('strong').textContent(),'Adv. Goblin Barracks');
   assert.equal(await card(31).locator('.building-summary').textContent(),'Recruit Hobgoblin Overlords.');
   assert.match(await card(5).locator('small').textContent(),/Construction forbidden in this town/);
   const beforeDetail=await commands();
   await card(5).tap();
   assert(await page.locator('[data-building-action]').isDisabled());
   assert.deepEqual(await commands(),beforeDetail,'Opening a building never constructs it');
   await button('sheet-back').tap();
   await tab('built').tap();
   assert.match(await card(16).innerText(),/Blacksmith.*2 variants/s);
   assert.equal(await card(17).count(),0);
   assert.equal(await card(18).count(),0);
   assert.match(await tab('built').innerText(),/Built 1/);
   const image=card(16).locator('img');
   await page.waitForFunction(()=>document.querySelector('[data-building-id="16"] img')?.naturalWidth>0);
   if(faction==='core:tower')assert.match(await image.getAttribute('src'),/tower\/structures\/blacksmith\.webp$/);
   await card(16).tap();
   assert.deepEqual(await page.locator('.building-detail li').allTextContents(),['War machines','Upgraded war machines.']);
   assert.deepEqual(await commands(),beforeDetail);
   await page.locator('[data-building-action]').tap();
   assert.deepEqual((await commands()).at(-1),[39,16]);
   await returnFromInspection();
   await button('build').tap();
   await page.evaluate(()=>{buildState.turn=true;sendBuild();});
   await page.locator('.building-locked summary').waitFor();
   assert(await card(31).isHidden());
   await page.locator('[data-building-filter="Recrutement"]').tap();
   assert(await card(31).isVisible());
   await page.locator('[data-building-filter=""]').tap();
   await card(0).tap();
   assert.deepEqual((await commands()).at(-1),[39,16]);
   await page.locator('[data-building-action]:enabled').tap();
   assert.deepEqual((await commands()).at(-1),[8,0],'Only the detail action constructs the building');
   assert(await page.locator('.mobile-sheet').isHidden());
   await button('recruit-heroes').tap();
   await page.waitForFunction(()=>document.querySelector('.toast-mobile').textContent==='The tavern is forbidden in this town.');
   assert.deepEqual((await commands()).at(-1),[8,0]);
   console.log('PASS',kind,faction,size.width+'x'+size.height);
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{
   const creature={id:25,name:'Test creature',rank:0,level:0,count:0,built:false,requiredBuildingId:31,requiredBuilding:'Test dwelling',cost:[]};
   window.calls=[];
   Object.assign(buildState,{mode:'fort',turn:true,fortFamilies:[{level:0,count:0,variants:[creature]}],buildings:[
    {id:0,key:'core:mageGuild1',name:'Mage Guild Level 1',built:false,allowed:true,state:7,cost:[]},
    {id:31,key:'core:dwellingLvl1',name:'Test dwelling',built:false,allowed:false,state:8,missingPrerequisites:[0],unlocksCreature:creature,cost:[]},
   ]});
   sendBuild();
  });
  await page.locator('[data-hall-build]').tap();
  const buildingTitle=page.locator('.building-detail h3');
  const goal=page.locator('.building-project strong');
  assert.equal(await buildingTitle.textContent(),'Test dwelling');
  assert.equal(await goal.textContent(),'Test dwelling');
  assert.match(await page.locator('[data-building-prerequisite]').innerText(),/Mage Guild Level 1/);
  assert.equal(await page.locator('.building-cards').count(),0);
  await page.locator('[data-building-prerequisite]').tap();
  assert.equal(await buildingTitle.textContent(),'Mage Guild Level 1');
  assert.equal(await goal.textContent(),'Test dwelling');
  await button('sheet-back').tap();
  assert.equal(await buildingTitle.textContent(),'Test dwelling');
  await page.locator('[data-building-prerequisite]').tap();
  await page.locator('[data-building-action]').tap();
  assert.deepEqual((await commands()).at(-1),[8,0]);
  await page.evaluate(()=>{
   Object.assign(buildState.buildings[0],{built:true,allowed:false,state:4});
   Object.assign(buildState.buildings[1],{state:5,missingPrerequisites:[]});
   sendBuild();
  });
  await page.getByRole('heading',{name:'Test dwelling',exact:true}).waitFor();
  assert(await page.locator('.building-project [data-built]').isVisible());
  assert(await page.locator('[data-building-action]').isDisabled());
  await button('sheet-back').tap();
  await page.locator('.mobile-sheet').waitFor({state:'hidden'});
  assert.equal(await page.locator('[data-family-select="25"]').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{
   Object.assign(buildState.buildings[1],{allowed:true,state:7});
   sendBuild();
  });
  await page.locator('[data-hall-build]').tap();
  await page.locator('[data-building-action]').tap();
  assert.deepEqual((await commands()).at(-1),[8,31]);
  await page.evaluate(()=>{
   Object.assign(buildState.buildings[1],{built:true,allowed:false,state:4,unlocksCreature:undefined});
   buildState.fortFamilies[0].variants[0].built=true;
   sendBuild();
  });
  await page.locator('[data-building-return]').tap();
  await page.locator('.mobile-sheet').waitFor({state:'hidden'});
  assert.equal(await page.locator('[data-family-select="25"]').getAttribute('data-locked'),null);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
