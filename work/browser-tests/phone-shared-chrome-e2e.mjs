import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
const sizes=[{width:320,height:568},{width:390,height:844},{width:716,height:279},{width:844,height:390}];
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});let activePage,currentCase;const events=[];browser.on('disconnected',()=>events.push('browser disconnected'));try{
 const page=await browser.newPage({hasTouch:true,serviceWorkers:'block'}),errors=[],navigations=[];activePage=page;page.on('crash',()=>events.push('page crashed'));page.on('console',message=>{if(message.type()==='error')events.push(message.text());});page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations.push(frame.url());});page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
 await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
 await page.route('**/phone-chrome',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><link rel=stylesheet href=/web/marketplace.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script>'}));
 await page.goto('http://localhost/phone-chrome');await page.waitForSelector('#mobile-app');
 await page.evaluate(async()=>{const{createUIElement}=await import('/web/ui/material-components.mjs');window.setTestLanguage=(await import('/web/i18n.mjs')).setLanguage;const menu=createUIElement('button');menu.id='game-menu-toggle';menu.textContent='☰';document.querySelector('.mobile-brand').replaceWith(menu);window.send=extra=>{window.model={turn:true,day:1,townName:'Castle',resources:[999,999,999,999,999,999,9999999],...extra};dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)}));};});
 for(const language of ['fr','en'])for(const viewport of sizes){
  currentCase={language,viewport};await page.setViewportSize(viewport);await page.waitForFunction(({width,height})=>innerWidth===width&&innerHeight===height,viewport);await page.evaluate(language=>window.setTestLanguage(language),language);
  await page.evaluate(()=>{calls.length=0;send({mode:'mage-guild',mageGuild:{town:1,levels:5,built:5,spells:Array.from({length:15},(_,id)=>({id,level:id%5+1,name:'Magic '+id,description:'A sufficiently detailed description of this magic spell and all its effects. '.repeat(12)}))}});});
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.mage-guild-library [role=combobox]:visible').count(),1,'One actual MUI level selector');
  assert.equal(await page.locator('[data-guild-page]').count(),0,'Spell list scrolls without pagination');
  const before=await page.locator('.mage-guild-level-field').boundingBox();
  await page.locator('.mage-guild-level-field [role=combobox]').click();await page.getByRole('option').nth(2).click();
  assert.equal(await page.locator('[data-guild-level-select]').inputValue(),'3');
  const after=await page.locator('.mage-guild-level-field').boundingBox();for(const key of ['x','y','width','height'])assert(Math.abs(before[key]-after[key])<1,'Level selector stays in place');
  const geometry=await page.locator('.mobile-mage-guild').evaluate(panel=>{const rect=n=>n.getBoundingClientRect().toJSON(),visible=n=>n.checkVisibility();return{detail:rect(panel.querySelector('.mage-guild-detail')),list:rect(panel.querySelector('.mage-guild-spells')),title:rect(panel.querySelector('h2')),close:[...document.querySelectorAll('[data-guild-close],[data-ui-rail-close]')].filter(visible).map(rect),resources:rect(document.querySelector('.mobile-resources')),detailScroll:panel.querySelector('.mage-guild-detail').scrollHeight>panel.querySelector('.mage-guild-detail').clientHeight};});
  assert(geometry.detail.width>geometry.list.width,'Description gets more width than spell choices');assert(geometry.detailScroll,'Long text owns its scroller');
  assert.equal(geometry.close.length,1,'Exactly one visible close action '+JSON.stringify({viewport,language,state:await page.evaluate(()=>({app:{w:document.querySelector('#mobile-app').clientWidth,h:document.querySelector('#mobile-app').clientHeight,...document.querySelector('#mobile-app').dataset},chrome:document.querySelector('.mobile-top').getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('[data-guild-close],[data-ui-rail-close]')].map(n=>({html:n.outerHTML,visible:n.checkVisibility(),display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility,rect:n.getBoundingClientRect().toJSON(),rules:(()=>{const a=[];function walk(rules){for(const r of rules){if(r.style?.display&&r.selectorText){try{if(n.matches(r.selectorText))a.push([r.selectorText,r.style.display]);}catch{}}if(r.cssRules)walk(r.cssRules);if(r.styleSheet)walk(r.styleSheet.cssRules);}}for(const s of document.styleSheets){try{walk(s.cssRules);}catch{}}return a;})()}))}))}));
  const close=geometry.close[0];assert(close.x>=0&&close.right<=viewport.width+1&&close.y>=0&&close.bottom<=viewport.height+1,'Exit within viewport');
  if(viewport.width>viewport.height)assert(Math.abs(close.y-geometry.resources.y)<24,'Exit is alongside the resource strip');
  await page.locator(viewport.width>viewport.height?'[data-ui-rail-close]':'[data-guild-close]').click();
  assert.equal(await page.evaluate(()=>calls.filter(a=>a[0]===0).length),1,'Shared exit delegates exactly once to native guild close');
  await page.evaluate(()=>send({mode:'market',marketQuotes:[[0,1,1,1]]}));await page.waitForTimeout(100);
  if(viewport.width>viewport.height){
   const boxes=await page.locator('.market-page').evaluate(panel=>['.market-header','.market-total','.market-stepper','.market-view-actions'].map(selector=>({selector,...panel.querySelector(selector).getBoundingClientRect().toJSON()})));
   for(const control of await page.locator('.market-view-actions>button:visible').all()){const b=await control.boundingBox();assert(b&&b.height>=48&&b.y+b.height<=viewport.height+1,'Every visible market action stays reachable '+JSON.stringify(b));}
   for(const b of boxes)assert(b.y>=0&&b.bottom<=viewport.height+1&&b.x>=0&&b.right<=viewport.width+1,'Market region within viewport '+JSON.stringify(b));
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.x<b.right-1&&b.x<a.right-1&&a.y<b.bottom-1&&b.y<a.bottom-1),'Market title, amount and actions must not overlap '+JSON.stringify({a,b}));}
  }
  for(const button of await page.locator('.market-grid[data-side=give] button').all()){
   const icon=await button.locator('img').boundingBox(),label=await button.locator('.market-resource-name').boundingBox();assert(icon&&label);assert(Math.abs(label.x-icon.x-icon.width)<=12,'Resource icon stays beside its name '+JSON.stringify({viewport,icon,label,html:await button.innerHTML()}));
  }
  if(language==='fr')await page.screenshot({path:`/tmp/phone-shared-chrome-${name}-${viewport.width}.png`});
 }
 assert.equal(navigations.length,1,'No reload while rotating or changing panels');assert.deepEqual(errors,[]);console.log('PASS',name,'shared landscape resource/close band, mage-level MUI Select, larger spell descriptions, marketplace icon alignment, FR/EN four phone sizes');
 }catch(error){await new Promise(resolve=>setTimeout(resolve,250));fs.writeFileSync('/tmp/phone-shared-failure-'+name+'.json',JSON.stringify({error:String(error),currentCase,events,url:activePage?.url(),closed:activePage?.isClosed(),state:await activePage?.evaluate(()=>({hasSend:typeof window.send,lang:document.documentElement.lang,mode:document.querySelector('#mobile-app')?.dataset.mode,calls:window.calls?.length})).catch(e=>String(e))},null,2));throw error;}finally{await browser.close();}
}
