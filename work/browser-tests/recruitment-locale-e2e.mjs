import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/opfs-worker.js',route=>route.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
  await page.route('**/overlay?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>Module={_vcmiMobileEnable(){},_vcmiMobileCommand(){}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
  await page.goto('http://localhost/overlay?mobile=1');await page.waitForSelector('#mobile-app');
  for(const language of ['fr','en','fr','en'])for(const [width,height]of [[393,852],[716,320]]){
   await page.setViewportSize({width,height});
   await page.evaluate(async language=>{
    (await import('/web/i18n.mjs')).setLanguage(language);
    const variants=[{id:150,name:'Sea Serpent',rank:0,built:true,count:5,attack:29,defense:20,damageMin:30,damageMax:55,health:300,speed:12,cost:[0,0,0,0,0,0,2200]},{id:151,name:'Leviathan',rank:1,built:true,count:5,attack:29,defense:20,damageMin:30,damageMax:55,health:300,speed:12,cost:[0,0,0,0,0,0,4000]}];
    dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'fort',turn:true,day:1,resources:[30,10,30,10,10,10,19500,0],fortFamilies:[{level:7,count:5,variants}],recruits:variants,fortRows:variants}}));
   },language);
   await page.waitForTimeout(150);
   const labels=await page.evaluate(()=>({title:document.querySelector('.creature-view-head h2').textContent,buy:document.querySelector('[data-recruit-all]').textContent,names:[...document.querySelectorAll('.hall-form-name')].map(n=>n.textContent),quantity:document.querySelector('.hall-number input').getAttribute('aria-label')}));
   assert.equal(labels.title,language==='fr'?'Salle de recrutement':'Recruitment hall');
   assert.equal(labels.buy,language==='fr'?'Tout recruter':'Recruit all');
   assert.deepEqual(labels.names,language==='fr'?['Serpent de mer','Léviathan']:['Sea Serpent','Leviathan']);
   assert.equal(labels.quantity,language==='fr'?'Quantité de recrutement':'Recruit quantity');
   // Live stock/quantity updates must not restore hybrid labels or cause an
   // observer loop after repeated language changes.
   const next=await page.locator('.hall-number input').evaluate(input=>Math.min(Number(input.max),Number(input.value)+1));
   await page.locator('[data-hall-more]').click();
   await page.waitForTimeout(80);
   assert.equal(await page.locator('[data-hall-buy]').textContent(),(language==='fr'?'Recruter ':'Recruit ')+next);
   if(width===393)await page.screenshot({path:'/tmp/recruitment-locale-'+name+'-'+language+'.png'});
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'recruitment labels, creature names, live updates and repeated FR/EN switching in portrait/landscape');
 }finally{await browser.close();}
}
