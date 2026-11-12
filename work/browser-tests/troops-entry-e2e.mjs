import {chromium,webkit} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-navigation-rotation';fs.mkdirSync(out,{recursive:true});
for(const kind of ['chromium','webkit']){
 const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true});const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await silenceTestAudio(p);
  await p.route('**/web/**',r=>{const f=path.resolve(process.env.GOONK_TEST_WEB_ROOT||'web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(f)?r.fulfill({path:f}):r.abort();});
  await p.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js')}));
  await p.route('**/navigation-review?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)},_vcmiMobilePointer(){}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
  await p.goto('http://localhost/navigation-review?mobile=1');await p.waitForSelector('#game-menu-toggle');
  const send=s=>p.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),s);
  const base={mode:'map',turn:true,day:1,week:1,month:1,resources:[20,10,20,10,10,10,15000,0],heroName:'Christian',heroMovement:1500,heroMana:10};
  await send(base);
  for(const size of [{width:390,height:844},{width:844,height:390},{width:768,height:1024},{width:1180,height:820}]){
   await p.setViewportSize(size);await send(base);const troops=p.locator('.mobile-nav [data-ui=heroes]');await troops.waitFor({state:'visible'});assert.equal((await troops.innerText()).trim(),'Troops');assert(await troops.locator('img').evaluate(e=>e.complete&&e.naturalWidth>0));
   const hero={...base,mode:'hero',heroWindow:{id:1,name:'Christian',owned:true,level:1,attack:1,defense:1,power:1,knowledge:1,equipment:[],backpack:[],worn:[],skills:[]},armies:[{id:1,name:'Christian',slots:[{id:1,name:'Pikeman',count:20}]}]};
   await troops.tap();assert.equal(await p.evaluate(()=>calls.at(-1)[0]),55);await send(hero);await p.locator('[data-hero-tab=army][aria-pressed=true]').waitFor({state:'visible'});await p.locator('[data-hero-tab=worn]').tap();assert.equal(await p.locator('[data-hero-tab=worn]').getAttribute('aria-pressed'),'true');
   await send(base);await p.locator('.mobile-nav [data-ui=heroes]').tap();await send(hero);await p.locator('[data-hero-tab=army][aria-pressed=true]').waitFor({state:'visible'});assert.equal(await p.locator('.hero-equipment-page').getAttribute('data-inventory'),'army');
  }
  assert.deepEqual(errors,[]);console.log('PASS',kind,'Troops opens native hero and selects Army every time across phone/iPad orientations');
 }finally{await browser.close();}
}
