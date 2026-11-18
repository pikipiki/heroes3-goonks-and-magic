import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  for(const language of ['fr','en'])for(const viewport of [{width:360,height:716},{width:716,height:279}]){
   const page=await browser.newPage({viewport,hasTouch:true}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.setDefaultTimeout(5000);
   await page.route('**/web/**',route=>{
    const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);
    return fs.existsSync(file)?route.fulfill({path:file}):route.abort();
   });
   await page.route('**/hero-default',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html class="goonk-mobile"><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="/web/mobile.css"><link rel="stylesheet" href="/web/h3-theme.css"><link rel="stylesheet" href="/web/mobile-upgrade.css">
    <div id="mobile-viewport" style="position:fixed;inset:0;container:goonk-viewport/size"><section id="mobile-app" data-mode="hero" style="display:block;height:100%"><main class="mobile-play" style="height:100%"></main></section></div>`}));
   await page.goto('http://localhost/hero-default');
   // Bound evaluation too: an observer loop used to starve the renderer when
   // a read-only hero had compact tabs but no equipment action footer.
   const evaluate=async(fn,arg)=>{
    let timer;
    try{return await Promise.race([page.evaluate(fn,arg),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Hero preview renderer stalled')),8000);})]);}
    finally{clearTimeout(timer);}
   };
   await evaluate(async language=>{
    const {setLanguage}=await import('/web/i18n.mjs');setLanguage(language);
    const {createHeroEquipment}=await import('/web/hero-equipment.mjs');
    window.controller=createHeroEquipment({root:document.querySelector('#mobile-app'),command(){}});
    window.hero={id:7,name:'Sylvia',owned:true,primarySkills:[2,2,1,1],slots:[],skills:[]};
    controller.update({mode:'hero',turn:true,heroWindow:hero});
   },language);
   const panel=page.locator('.hero-equipment-page');
   assert.equal(await panel.getAttribute('data-inventory'),'worn');
   await evaluate(()=>{controller.update({mode:'dialog'});hero.owned=false;controller.update({mode:'hero',turn:true,heroWindow:hero});});
   assert.equal(await panel.getAttribute('data-inventory'),'skills','A hero for hire opens on Skills');
   const worn=page.locator('[data-hero-tab=worn]');
   if(!await worn.isVisible())await page.locator('.hero-bag-tabs>.ui-overflow-trigger').tap();
   await worn.tap();assert.equal(await panel.getAttribute('data-inventory'),'worn');
   await evaluate(()=>controller.update({mode:'hero',turn:true,heroWindow:{...hero,mana:9}}));
   assert.equal(await panel.getAttribute('data-inventory'),'worn','Native updates keep the chosen tab');
   await evaluate(()=>{controller.update({mode:'creature'});controller.update({mode:'hero',turn:true,heroWindow:hero});});
   assert.equal(await panel.getAttribute('data-inventory'),'worn','Returning from creature details keeps the chosen tab');
   await evaluate(()=>{controller.update({mode:'dialog'});controller.update({mode:'hero',turn:true,heroWindow:{...hero,id:8}});});
   assert.equal(await panel.getAttribute('data-inventory'),'skills','The next hero for hire starts on Skills again');
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS',name,'FR/EN, portrait/landscape: recruitment defaults to Skills, manual tabs and detail return preserved, no observer loop');
 }finally{await browser.close();}
}
