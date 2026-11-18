import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const unit={id:1,name:'Leviathan',attack:29,defense:20,damageMin:30,damageMax:55,health:300,speed:12,description:'Souffle sur deux cases. Provoque la peur et y résiste.',abilities:['{Souffle} Attaque de souffle sur deux hexagones.']};
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/opfs-worker.js',route=>route.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
  await page.route('**/overlay?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
  await page.goto('http://localhost/overlay?mobile=1');await page.waitForSelector('#mobile-app');
  for(const upgrades of [false,true])for(const language of ['fr','en'])for(const [width,height,bottom,top]of [[430,932,34,62],[932,430,21,0],[430,932,34,62],[393,852,34,59],[360,640,0,0]]){
   await page.setViewportSize({width,height});
   await page.evaluate(async({language,bottom,top,unit,upgrades})=>{(await import('/web/i18n.mjs')).setLanguage(language);const root=document.querySelector('#mobile-app');root.style.setProperty('--safe-bottom',bottom+'px');root.style.paddingTop=top+'px';root.style.paddingBottom=bottom+'px';dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'creature',turn:true,day:1,resources:[30,10,30,10,10,10,19500,0],creatureUnit:unit,creatureUpgrades:upgrades?[{...unit,id:2,name:'Leviathan II',cost:[0,0,0,0,0,0,100,0],affordable:true}]:[]}}));},{language,bottom,top,unit,upgrades});
   await page.waitForTimeout(120);
   const bounds=await page.evaluate(()=>{const root=document.querySelector('#mobile-app'),panel=document.querySelector('.creature-presentation'),nav=document.querySelector('.mobile-nav');return{root:root.getBoundingClientRect().toJSON(),panel:panel.getBoundingClientRect().toJSON(),navDisplay:getComputedStyle(nav).display,paddingBottom:parseFloat(getComputedStyle(panel).paddingBottom)};});
   assert(Math.abs(bounds.panel.bottom-height)<1,'Creature overlay covers the bottom edge '+JSON.stringify({name,width,height,bottom,bounds}));
   assert.equal(bounds.navDisplay,'none','No empty navigation strip below the overlay');
   assert(bounds.paddingBottom>=bottom,'Content keeps the home indicator inset inside the overlay');
   if(upgrades){const action=page.locator('[data-upgrade]').first();await action.scrollIntoViewIfNeeded();const box=await action.boundingBox();assert(box&&box.y+box.height<=height-bottom+1,'Upgrade action remains above the home indicator');}
   if(!upgrades&&language==='fr'&&width===430&&height===932)await page.screenshot({path:'/tmp/creature-overlay-'+name+'.png'});
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'FR/EN, portrait/landscape/portrait, safe areas and small URL-bar viewport: overlay reaches the bottom');
 }finally{await browser.close();}
}
