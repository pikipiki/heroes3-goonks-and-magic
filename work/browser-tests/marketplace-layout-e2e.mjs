import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:716,height:279},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await silenceTestAudio(page);
  await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
  await page.route('**/market-test?mobile=1',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/marketplace.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...a){calls.push(a)}};window.goonkAssetURLs=[{path:"Mods/foo/Content/Sprites/mithril.png",url:"/web/h3-theme/resource-ore.png"}];</script><script type=module src=/web/mobile.mjs></script>'}));
  await page.goto('http://localhost/market-test?mobile=1');await page.waitForSelector('#mobile-app');await page.evaluate(()=>{const m=document.createElement('button');m.id='game-menu-toggle';m.textContent='☰';document.querySelector('.mobile-brand').replaceWith(m);});
  await page.evaluate(()=>dispatchEvent(new CustomEvent('goonk-state',{detail:{mode:'market',turn:true,day:8,resources:[9999,9999,9999,9999,9999,9999,9999999,9999],resourceTypes:[{},{},{},{},{},{},{},{id:7,key:'mithril',name:'Mithril',icon:'mithril.png',scope:'foo'}],marketQuotes:[[0,1,10,1],[6,5,5000,1],[7,0,2,1]]}})));await page.waitForSelector('.market-page:not([hidden])');
  for(const size of [{width:716,height:279},{width:568,height:320},{width:844,height:390},{width:360,height:659}]){
   await page.setViewportSize(size);await page.waitForTimeout(120);
   if(size.width<size.height){const top=await page.locator('.mobile-top').boundingBox(),market=await page.locator('.market-page').boundingBox();assert(top.y<market.y&&top.y+top.height<=market.y+1,'Kingdom header stays above portrait marketplace');}
   const cells=await page.locator('.market-grid[data-side=give] button').evaluateAll(nodes=>nodes.map(e=>{const label=e.querySelector('span'),value=e.querySelector('small'),r=document.createRange();r.selectNodeContents(label);const v=document.createRange();v.selectNodeContents(value);return {box:e.getBoundingClientRect().toJSON(),label:label.getBoundingClientRect().toJSON(),text:r.getBoundingClientRect().toJSON(),value:v.getBoundingClientRect().toJSON(),quantity:value.textContent};}));
   for(const cell of cells){assert(cell.box.width>=44&&cell.box.height>=44);assert(cell.text.y>=cell.box.y&&cell.value.bottom<=cell.box.bottom,'Labels and quantities remain inside their tile '+JSON.stringify({size,cell}));assert(cell.text.right<=cell.box.right&&cell.value.right<=cell.box.right,'Complete text fits '+JSON.stringify({size,cell}));assert(cell.text.bottom<=cell.value.y,'Label never overlaps quantity '+JSON.stringify({size,cell}));if(size.width>size.height)assert(Math.abs((cell.label.left+cell.label.right)/2-(cell.value.left+cell.value.right)/2)<1,'Name and quantity share their center axis');}
   assert.equal(cells[6].quantity,'9 999 999','Marketplace gold keeps all digits with spaces');
   for(const id of ['trade','close']){const r=await page.locator('[data-market='+id+']').boundingBox();assert(r.y>=0&&r.y+r.height<=size.height,'Actions remain visible');}
   if(size.width===716)await page.screenshot({path:'/tmp/marketplace-'+kind+'.png'});
  }
  await page.locator('.market-grid[data-side=give] [data-resource-id="6"]').click();await page.locator('.market-grid[data-side=receive] [data-resource-id="5"]').click();
  await page.locator('.market-stepper input').fill('3');
  const summary=page.locator('.market-total');assert.deepEqual(await summary.locator('.market-total-value').allTextContents(),['15 000','3']);assert.equal(await summary.locator('img').count(),2);assert.match(await summary.getAttribute('aria-label'),/15 000 Gold → 3 Gems/);
  await page.waitForFunction(()=>[...document.querySelectorAll('.market-total img')].every(i=>i.complete&&i.naturalWidth>0));
  assert((await summary.locator('img').nth(0).getAttribute('src')).includes('resource-gold.png'));assert((await summary.locator('img').nth(1).getAttribute('src')).includes('resource-gems.png'));
  await page.evaluate(()=>window.summaryIcon=document.querySelector('.market-total img'));await page.locator('[data-market=plus]').click();assert(await page.evaluate(()=>summaryIcon===document.querySelector('.market-total img')),'Quantity changes preserve decoded icon nodes');
  for(const language of ['fr','en']){await page.evaluate(async language=>(await import('/web/i18n.mjs')).setLanguage(language),language);for(const size of [{width:360,height:659},{width:716,height:279}]){await page.setViewportSize(size);await page.waitForTimeout(100);const fit=await summary.evaluate(e=>({w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,sh:e.scrollHeight}));assert(fit.sw<=fit.w+1&&fit.sh<=fit.h+1,'Icon exchange summary fits');assert.equal(await summary.locator('img').nth(0).getAttribute('alt'),language==='fr'?'Or':'Gold');assert.equal(await summary.locator('img').nth(1).getAttribute('alt'),language==='fr'?'Gemmes':'Gems');await page.screenshot({path:'/tmp/market-summary-'+kind+'-'+language+'-'+size.width+'.png'});}}
  await page.locator('.market-grid[data-side=receive] [data-resource-id="0"]').click();await page.locator('.market-grid[data-side=give] [data-resource-id="7"]').click();assert((await summary.locator('img').first().getAttribute('src')).includes('resource-ore.png'),'Modded resource summary uses its registered icon');
  assert.deepEqual(errors,[]);console.log('PASS',kind,'marketplace resource labels, aligned quantities, full gold and fixed actions');
 }finally{await browser.close();}
}
