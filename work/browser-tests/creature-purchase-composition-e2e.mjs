import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
const sizes=[{width:320,height:568},{width:360,height:659},{width:430,height:932},{width:716,height:279},{width:568,height:320},{width:844,height:390}];
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
 const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
 await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
 await page.route('**/opfs-worker.js',route=>route.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsFlush=async()=>{},opfsUnlink=async()=>{};'}));
 await page.route('**/creature-purchase?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/game-menu.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script><script type=module src=/web/game-menu.mjs></script>'}));
 await page.goto('http://127.0.0.1:8782/creature-purchase?mobile=1');await page.waitForSelector('#game-menu-toggle');
 for(const language of ['fr','en'])for(const size of sizes){
  await page.setViewportSize(size);await page.evaluate(async language=>{(await import('/web/i18n.mjs')).setLanguage(language);window.unit={id:127,name:language==='fr'?"Élémentaire de l’Air":'Air Elemental',count:6,attack:9,defense:9,damageMin:2,damageMax:8,health:25,speed:7,cost:[0,0,0,0,0,0,250],nativeFlags:{flying:false},abilities:Array.from({length:14},(_,i)=>(language==='fr'?'Capacité spéciale ':'Special ability ')+(i+1)+' : '+(language==='fr'?'Description de la capacité complète.':'Complete ability description.'))};window.model={mode:'recruit',turn:true,day:1,resources:[9999,9999,9999,9999,9999,9999,9999999],recruitUnit:unit,recruitAmount:6,recruitMaximum:6,previewUnits:[unit]};window.send=()=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)}));send();},language);
  await page.locator('.recruitment-view').waitFor();await page.waitForTimeout(100);
  const boxes=await page.evaluate(()=>{const box=selector=>{const n=document.querySelector(selector),r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,sh:n.scrollHeight,ch:n.clientHeight,sw:n.scrollWidth,cw:n.clientWidth}};return{viewport:[innerWidth,innerHeight],art:box('.creature-stage'),price:box('.recruit-economy'),quantity:box('.mobile-recruit-amount'),description:box('.recruit-description'),slider:box('.MuiSlider-root'),nav:box('.mobile-nav'),context:box('.recruit-context'),heading:box('.creature-view-head'),chrome:box('.mobile-top')};});
  for(const key of ['price','quantity','slider']){const b=boxes[key];assert(b.w>70&&b.x>=-1&&b.right<=size.width+1&&b.y>=-1&&b.bottom<=size.height+1,JSON.stringify({name,language,size,key,boxes}));if(key!=='slider')assert(b.sw<=b.cw+2,JSON.stringify({key,boxes}));}
  assert(boxes.price.bottom<=boxes.nav.y+1&&boxes.quantity.bottom<=boxes.nav.y+1,'Purchase context stays above commands '+JSON.stringify(boxes));
  if(size.height>size.width){assert(boxes.price.w>size.width*.8);assert(boxes.quantity.w>size.width*.8);assert(boxes.art.h>=128,'Native animation retains its allocated height');}
  else {assert(boxes.context.sh<=boxes.context.ch+2,'Unit price needs no scrolling '+JSON.stringify({size,boxes}));assert(boxes.heading.y>=boxes.chrome.bottom-1,'Title stays below resources/menu');}
  assert(await page.locator('.recruit-stock').evaluate(n=>n.classList.contains('MuiPaper-root')));assert(await page.locator('.featured-price').evaluate(n=>n.classList.contains('MuiPaper-root')));
  assert(boxes.description.sh>boxes.description.ch,'Long abilities scroll in their own region');
  if(language==='fr'&&[360,716].includes(size.width))await page.screenshot({path:'/tmp/purchase-composition-'+name+'-'+size.width+'.png'});
  // Inspection consumes the same regions without any purchase controls.
  await page.evaluate(()=>{model={...model,mode:'creature',creatureUnit:unit,creatureUpgrades:[]};send();});await page.locator('[data-ui-creature-overview=inspect]').waitFor();
  if(size.width>size.height){const layout=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect().toJSON();return {art:box('.creature-stage'),stats:box('.creature-facts'),description:box('.creature-narrative'),title:box('.creature-view-head'),chrome:box('.mobile-top')};});assert(layout.art.right<=layout.stats.x+1&&layout.stats.right<=layout.description.x+1&&layout.description.right<=layout.title.x+1,JSON.stringify({size,layout}));assert(layout.title.y>=layout.chrome.bottom-1);}
 }
 assert.deepEqual(errors,[]);console.log('PASS',name,'shared purchase/inspection regions, unit price always visible, native art retained, 6 sizes FR/EN');
 }finally{await browser.close();}
}
