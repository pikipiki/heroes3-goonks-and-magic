import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';
for(const kind of ['chromium','webkit']){const browser=await(kind==='webkit'?webkit.launch({executablePath:process.env.WEBKIT_PATH}):chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}));try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[],iconRequests=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/web/**',async r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);if(!fs.existsSync(file))return r.abort();await r.fulfill({path:file});});
 await p.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js'),contentType:'text/javascript'}));
 await p.route('**/h3-theme/spells/*.png',r=>{iconRequests.push(r.request().url());return r.abort();});
 await p.route('**/spells-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto('http://127.0.0.1:8782/spells-test?mobile=1');await p.waitForSelector('#game-menu-toggle');
 await p.evaluate(()=>{window.spells=Array.from({length:6},(_,i)=>({id:15+i,name:['Magic Arrow','Ice Bolt','Lightning Bolt','Implosion','Chain Lightning','Frost Ring'][i],cost:5,level:1,enabled:true,description:'A magical attack against the selected target.',target:'enemy'}));window.book={mana:30,page:0,pages:2,school:-1,spells};window.send=(mode='spellbook',extra={})=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode,heroId:1,heroName:'Xarfax',turn:true,day:16,heroMana:30,spellbook:mode==='spellbook'?structuredClone(book):undefined,...extra}}));send();});
 // Combat defaults to browsing. Both targeted and untargeted spells require confirmation.
 const reopen=async(readOnly=false)=>{await p.evaluate(()=>send('map'));await p.locator('.mobile-spellbook').waitFor({state:'hidden'});await p.evaluate(readOnly=>{book={mana:30,page:0,pages:1,school:-1,inCombat:true,readOnly,spells:[spells[0],{...spells[1],enabled:false},{...spells[2],target:'none'}]};calls=[];send();},readOnly);await p.locator('.mobile-spellbook').waitFor({state:'visible'});};
 for(const size of [{width:390,height:844},{width:844,height:390},{width:568,height:320}]){
  await p.setViewportSize(size);await reopen();
  await p.locator('[data-spell="15"]').tap();assert.equal(await p.evaluate(()=>calls.filter(c=>c[0]===49).length),0,'Default spell tap only selects details');
  await p.locator('[data-cast-spell]').tap();assert.deepEqual((await p.evaluate(()=>calls.at(-1))).slice(0,2),[49,15]);
  await reopen();await p.locator('[data-spell="17"]').tap();assert.equal(await p.evaluate(()=>calls.filter(c=>c[0]===49).length),0,'Untargeted spells also require confirmation');
  await p.locator('[data-cast-spell]').tap();assert.deepEqual((await p.evaluate(()=>calls.at(-1))).slice(0,2),[49,17]);
 }
 await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=settings]').tap();
 const fast=p.locator('[data-spell-one-click]');assert.equal(await fast.isChecked(),false);await fast.check();await p.locator('[data-menu=close]').tap();
 await reopen();await p.locator('[data-spell="15"]').tap();assert.deepEqual((await p.evaluate(()=>calls.at(-1))).slice(0,2),[49,15],'Opt-in spell tap immediately starts target choice');
 await reopen();await p.locator('[data-spell="16"]').tap();assert.equal(await p.evaluate(()=>calls.filter(c=>c[0]===49).length),0,'Unavailable spells cannot be chosen with one click');
 await reopen(true);await p.locator('[data-spell="15"]').tap();assert.equal(await p.evaluate(()=>calls.filter(c=>c[0]===49).length),0,'Read-only books stay read-only');
 await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=settings]').tap();assert(await fast.isChecked(),'Preference survives reopening settings');await fast.uncheck();await p.locator('[data-menu=close]').tap();
 await reopen();await p.locator('[data-spell="15"]').tap();assert.equal(await p.evaluate(()=>calls.filter(c=>c[0]===49).length),0,'Turning off one click restores confirmation immediately');
 await p.screenshot({path:'/tmp/goonk-spell-confirmation-'+kind+'.png'});assert.deepEqual(errors,[]);assert.deepEqual(iconRequests,[]);console.log('PASS',kind,'default confirmation, opt-in immediate selection, unavailable and read-only spells, portrait and landscape');
 }finally{await browser.close();}}
