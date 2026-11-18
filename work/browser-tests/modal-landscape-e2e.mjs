import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:716,height:279},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
  await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
  await page.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js'),contentType:'text/javascript'}));
  await page.route('**/modal-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
  await page.goto('http://localhost/modal-test?mobile=1');await page.waitForSelector('#game-menu-toggle');
  const state={mode:'map',turn:true,day:8,heroName:'Hero',autosaveAllowed:true,resources:[999,999,999,999,999,999,9999999],weeklyRecruitsReady:true,towns:[{id:1,name:'Goonkburg',weeklyRecruits:Array.from({length:20},(_,i)=>({count:12,growth:7,forms:[{id:i,name:'Creature '+i,built:true}]}))}]};
  const send=s=>page.evaluate(s=>dispatchEvent(new CustomEvent('goonk-state',{detail:s})),s);await send(state);await page.waitForTimeout(350);
  await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-save-persisted',{detail:{path:'/Saves/Goonk-auto.vsgm1',ok:true}})));
  const box=s=>page.locator(s).boundingBox();
  for(const size of [{width:716,height:279},{width:568,height:320},{width:1024,height:768}]){
   await page.setViewportSize(size);await page.waitForTimeout(200);await page.locator('#game-menu-toggle').tap();await page.waitForTimeout(80);
   for(const tab of ['home','settings','cheats']){
    if(tab!=='home')await page.locator('[data-menu='+tab+']').tap();
    await page.waitForFunction(tab=>document.querySelector('#game-menu').dataset.page===tab,tab);
    const head=await box('#game-menu>header'),body=await box(tab==='home'?'#game-menu>nav':'#game-menu>.game-menu-body'),close=await box('#game-menu>header [data-menu=close]');
    assert(head.x>=size.width/2&&close.x>=size.width/2,'Menu title and close sit in the right rail');assert(body.x+body.width<=head.x+1&&body.y<=head.y+1,'Content starts at full height to the left');assert(close.y>=0&&close.y+close.height<=size.height,'Close remains reachable');
    if(tab==='home'){for(const key of ['settings','cheats','save','storage','new-game']){const b=await box('[data-menu='+key+']');assert(b.y>=0&&b.y+b.height<=size.height,'All menu actions fit including Save');}}
    if(tab==='settings')await page.locator('.game-menu-return [data-menu=back]').tap();
   }
   await page.locator('#game-menu>header [data-menu=close]').tap();
   await page.locator('.mobile-calendar').tap();await page.waitForSelector('.weekly-roster');
   const head=await box('.sheet-head'),body=await box('.sheet-body');assert(head.x>=size.width/2&&body.x+body.width<=head.x+1,'Shared modal uses right header rail');assert(body.y<=head.y+1&&body.height>=size.height-20,'Shared modal content retains viewport height');
   await page.locator('.sheet-body').hover();await page.mouse.wheel(0,500);await page.waitForTimeout(100);assert(await page.locator('.sheet-body').evaluate(e=>e.scrollTop>0),'Long modal content remains scrollable');
   await page.locator('[data-ui=close-sheet]').tap();
  }
  await page.locator('#game-menu-toggle').tap();const save=page.locator('[data-menu=save]');assert.equal(await save.evaluate(e=>e.previousElementSibling.dataset.menu),'cheats');assert.equal(await save.evaluate(e=>e.nextElementSibling.dataset.menu),'storage');
  const before=await page.evaluate(()=>calls.filter(c=>c[0]===34).length);await save.tap();assert(await save.isDisabled());assert.match(await page.locator('.game-menu-status').textContent(),/Saving/);assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]===34).length),before+1,'Manual save uses the existing persistence controller once');
  assert(!((await page.locator('.game-menu-status').textContent()).includes('Game saved')),'No success before disk persistence');await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-save-persisted',{detail:{path:'/Saves/Goonk-auto.vsgm1',ok:true}})));assert.equal(await page.locator('.game-menu-status').textContent(),'Game saved.');assert(await save.isEnabled());
  await page.evaluate(async()=>{const {setLanguage}=await import('/web/i18n.mjs');setLanguage('fr');});assert.equal(await save.textContent(),'Sauvegarder','Save follows the chosen language');
  await send({...state,mode:'battle',autosaveAllowed:false});assert(await save.isDisabled(),'Save respects engine checkpoint availability');
  await page.screenshot({path:'/tmp/modal-landscape-'+kind+'.png'});assert.deepEqual(errors,[]);console.log('PASS',kind,'menu rails, shared scrolling modal, Save order, request and confirmed persistence');
 }finally{await browser.close();}
}
