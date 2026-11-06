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
   await button('build').tap();
   assert.equal(await tab('unbuilt').getAttribute('aria-pressed'),'true');
   assert.match(await card(0).innerText(),/Mage guild/);
   assert(await card(0).locator('button').isDisabled());
   assert.equal(await card(31).locator('h3').textContent(),'Adv. Goblin Barracks');
   assert.equal(await card(31).locator('p').textContent(),'Recruit Hobgoblin Overlords.');
   assert(await card(31).locator('button').isDisabled());
   assert.equal(await card(5).locator('small').textContent(),'Construction forbidden in this town');
   assert(await card(5).locator('button').isDisabled());
   await tab('built').tap();
   assert.match(await card(16).innerText(),/Blacksmith/);
   const image=card(16).locator('img');
   await page.waitForFunction(()=>document.querySelector('[data-building-id="16"] img')?.naturalWidth>0);
   if(faction==='core:tower')assert.match(await image.getAttribute('src'),/tower\/structures\/blacksmith\.webp$/);
   await card(16).locator('button').tap();
   assert.deepEqual((await commands()).at(-1),[39,16]);
   await returnFromInspection();
   await button('build').tap();
   await page.evaluate(()=>{buildState.turn=true;sendBuild();});
   await card(0).locator('button:enabled').tap();
   assert.deepEqual((await commands()).at(-1),[8,0],'Building is allowed once the player’s turn begins');
   assert(await page.locator('.mobile-sheet').isHidden());
   await button('recruit-heroes').tap();
   await page.waitForFunction(()=>document.querySelector('.toast-mobile').textContent==='The tavern is forbidden in this town.');
   assert.deepEqual((await commands()).at(-1),[8,0]);
   console.log('PASS',kind,faction,size.width+'x'+size.height);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
