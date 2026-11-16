import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 for(const width of [360,430]){
 const p=await browser.newPage({viewport:{width,height:873},hasTouch:true,...(width===360?{userAgent:'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/90.0 Mobile Safari/537.36'}:{})}),errors=[];await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await p.route('**/opfs-worker.js',r=>r.fulfill({path:path.resolve('work/vcmi-wasm/lib/html5/opfs-worker.js'),contentType:'text/javascript'}));
 await p.route('**/settings',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await p.goto('http://localhost/settings');await p.waitForSelector('#game-menu-toggle');
 await p.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'map',turn:true,day:1,heroName:'Marius',mapSettings:{moveTime:150,enemyMoveTime:150}}})));
 await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=settings]').tap();
 const option=p.locator('[data-map-two-clicks]');await option.waitFor({state:'visible'});await option.check();assert(await option.isChecked(),'Two-click movement is available on Android and iPhone');
 await p.waitForFunction(()=>[...document.querySelectorAll('#game-menu .setting-icon')].length===2&&[...document.querySelectorAll('#game-menu .setting-icon')].every(i=>i.complete&&i.naturalWidth>0&&i.src.startsWith('data:image/')));
 const selects=await p.locator('#game-menu[data-page=settings] select').evaluateAll(es=>es.map(e=>{const c=getComputedStyle(e);return {appearance:c.appearance,radius:c.borderRadius,font:c.font,border:c.borderTop,padding:c.padding,height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width};}));
 assert.equal(selects.length,3);for(const select of selects){assert.equal(select.appearance,'none');assert.equal(select.radius,'0px');assert(select.height>=48&&select.width>width*.65);assert.equal(select.border,selects[0].border);assert.equal(select.font,selects[0].font);}
 const body=p.locator('.game-menu-body');await body.evaluate(e=>e.scrollTop=e.scrollHeight);
 await p.locator('[data-menu=close]').tap();await p.locator('#game-menu-toggle').tap();await p.locator('[data-menu=settings]').tap();
 assert.equal(await body.evaluate(e=>e.scrollTop),0,'Settings reopen at the top so the option cannot stay above the clipped scroll position');
 const label=await option.locator('..').boundingBox(),content=await body.boundingBox();assert(label.y>=content.y&&label.y+label.height<=content.y+content.height,'Two-click option is in view on entering settings');
 await p.screenshot({path:'/tmp/settings-icons-'+kind+'-'+width+'.png'});assert.deepEqual(errors,[]);console.log('PASS',kind,width,'uniform selects, preloaded Heroes III icons and visible two-click option');await p.close();
 }
 }finally{await browser.close();}
}
