import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
 await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await page.route('**/resources',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script>'}));
 await page.goto('http://localhost/resources');await page.waitForSelector('#mobile-app');
 await page.evaluate(()=>{const b=document.createElement('button');b.id='game-menu-toggle';b.textContent='☰';document.querySelector('.mobile-brand').replaceWith(b);});
 for(const width of [320,360,390,430]){
 await page.setViewportSize({width,height:844});
 await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'map',turn:true,day:1,heroName:'Zydar',resources:[2200,2050,2200,2100,2100,2100,198500,200],weeklyRecruitsReady:true}})));
 await page.waitForTimeout(150);
 const metrics=await page.locator('.mobile-resources').evaluate(el=>{
 const r=el.getBoundingClientRect(),top=el.closest('header').getBoundingClientRect();
 return {width:r.width,topWidth:top.width,items:[...el.querySelectorAll('.resource-quantity')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,needed:e.scrollWidth}})};
 });
 assert(metrics.width>=metrics.topWidth-12,'Resources use the entire header width');assert.equal(metrics.items.length,8);
 for(let i=0;i<metrics.items.length;i++){const item=metrics.items[i];assert(item.x>=0&&item.right<=width,'Quantity remains on screen');assert(item.needed<=item.width+1,'Quantity is not clipped');if(i)assert(item.x>=metrics.items[i-1].right,'Quantities do not overlap');}
 if(width===390)await page.screenshot({path:'/tmp/resources-'+name+'.png'});
 }
 assert.deepEqual(errors,[]);console.log(name+': full-width resources passed at 320–430px');
 }finally{await browser.close();}
}
