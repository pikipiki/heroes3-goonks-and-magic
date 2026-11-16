import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
 const p=await browser.newPage({viewport:{width:430,height:873},hasTouch:true}),errors=[];await silenceTestAudio(p);p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
 await p.route('**/clip',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};</script><script type=module src=/web/mobile.mjs></script>'}));
 await p.goto('http://localhost/clip');await p.waitForSelector('#mobile-app');
 await p.evaluate(()=>{
 window.retainedScroll=59;
 Object.defineProperty(window,'scrollY',{configurable:true,get:()=>retainedScroll});
 Object.defineProperty(window,'orientation',{configurable:true,get:()=>innerWidth>innerHeight?90:0});
 for(const key of ['offsetTop','pageTop'])Object.defineProperty(visualViewport,key,{configurable:true,get:()=>retainedScroll});
 // Model the measured iPhone body origin (-59) with a retained document scroll.
 document.body.style.transform='translateY(-59px)';
 const style=document.createElement('style');style.id='old-body-clip';style.textContent='html.goonk-mobile body{overflow:hidden!important}';document.head.append(style);
 dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'map',turn:true,day:3,heroName:'Marius',resources:[120,109,120,110,110,113,106900,100]}}));dispatchEvent(new Event('resize'));
 });await p.waitForTimeout(350);
 const hit=()=>p.locator('[data-ui=endturn]').evaluate(button=>{const r=button.getBoundingClientRect(),node=document.elementFromPoint(r.x+r.width/2,r.bottom-2);return node===button||button.contains(node);});
 assert.equal(await hit(),false,'Old body overflow reproduces the actual iPhone clipped hit target');
 await p.evaluate(()=>document.querySelector('#old-body-clip').remove());
 assert.equal(await hit(),true,'Removing only the body clip restores the lower part of the button');
 for(const size of [{width:932,height:430},{width:430,height:873}]){
 await p.setViewportSize(size);await p.evaluate(()=>{retainedScroll=innerWidth<innerHeight?59:0;document.body.style.transform='translateY(-'+retainedScroll+'px)';dispatchEvent(new Event('orientationchange'));});await p.waitForTimeout(350);
 assert.equal(await hit(),true,'Bottom action remains painted and hittable after rotation');
 const button=p.locator('[data-ui=endturn]'),before=await p.evaluate(()=>calls.filter(c=>c[0]===3).length);await button.tap();assert.equal(await p.evaluate(()=>calls.filter(c=>c[0]===3).length),before+1);
 }
 assert.deepEqual(errors,[]);await p.screenshot({path:'/tmp/ios-body-clip-'+kind+'.png'});console.log('PASS',kind,'actual iPhone retained-scroll clipping regression and rotation hits');
 }finally{await browser.close();}
}
