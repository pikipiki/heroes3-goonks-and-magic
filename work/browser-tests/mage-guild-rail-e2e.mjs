import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {silenceTestAudio} from './silent-audio.mjs';
const sizes=[{width:320,height:568},{width:360,height:659},{width:390,height:844},{width:716,height:279},{width:844,height:390}];
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
  assert.equal(await page.locator('.mobile-mage-guild [role=combobox]:visible').count(),1,'One actual MUI level selector');
  assert.equal(await page.locator('[data-guild-page]').count(),0,'Spell list scrolls without pagination');
  const before=await page.locator('.mage-guild-level-field').boundingBox();
  await page.locator('[data-guild-level-select]').evaluate(n=>window.originalMageLevel=n);
  await page.locator('.mage-guild-level-field [role=combobox]').click();await page.getByRole('option').nth(2).click();
  assert.equal(await page.locator('[data-guild-level-select]').inputValue(),'3');
  assert(await page.locator('[data-guild-level-select]').evaluate(n=>n===window.originalMageLevel),'Native select survives filtering');
  const after=await page.locator('.mage-guild-level-field').boundingBox();for(const key of ['x','y','width','height'])assert(Math.abs(before[key]-after[key])<1,'Level selector stays in place');
  const geometry=await page.locator('.mobile-mage-guild').evaluate(panel=>{const rect=n=>n.getBoundingClientRect().toJSON(),visible=n=>n.checkVisibility();return{detail:rect(panel.querySelector('.mage-guild-detail')),list:rect(panel.querySelector('.mage-guild-spells')),title:rect(panel.querySelector('h2')),close:[...document.querySelectorAll('[data-guild-close],[data-ui-rail-close]')].filter(visible).map(rect),resources:rect(document.querySelector('.mobile-resources')),detailScroll:panel.querySelector('.mage-guild-detail').scrollHeight>panel.querySelector('.mage-guild-detail').clientHeight};});
  assert(geometry.detail.width>geometry.list.width,'Description gets more width than spell choices');assert(geometry.detailScroll,'Long text owns its scroller');
  assert.equal(geometry.close.length,1,'Exactly one visible close action '+JSON.stringify({viewport,language,state:await page.evaluate(()=>({app:{w:document.querySelector('#mobile-app').clientWidth,h:document.querySelector('#mobile-app').clientHeight,...document.querySelector('#mobile-app').dataset},chrome:document.querySelector('.mobile-top').getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('[data-guild-close],[data-ui-rail-close]')].map(n=>({html:n.outerHTML,visible:n.checkVisibility(),display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility,rect:n.getBoundingClientRect().toJSON(),rules:(()=>{const a=[];function walk(rules){for(const r of rules){if(r.style?.display&&r.selectorText){try{if(n.matches(r.selectorText))a.push([r.selectorText,r.style.display]);}catch{}}if(r.cssRules)walk(r.cssRules);if(r.styleSheet)walk(r.styleSheet.cssRules);}}for(const s of document.styleSheets){try{walk(s.cssRules);}catch{}}return a;})()}))}))}));
  const close=geometry.close[0];assert(close.x>=0&&close.right<=viewport.width+1&&close.y>=0&&close.bottom<=viewport.height+1,'Exit within viewport');
  if(viewport.width>viewport.height){
   const panel=await page.locator('.mobile-mage-guild').boundingBox();
   assert(before.x>viewport.width/2,'Level selector is in the right rail');
   assert(geometry.list.y<=panel.y+12,'Spell list starts at the top of available content');
   assert(geometry.detail.y+geometry.detail.height>=panel.y+panel.height-12,'Description uses full available height');
  }
  assert.deepEqual(await page.locator('[data-guild-level-select] option').allTextContents(),Array.from({length:5},(_,i)=>(language==='fr'?'Niveau ':'Level ')+(i+1)));
  assert.equal(await page.locator('.mage-guild-shelf-head').count(),0);
  const chain=await page.locator('.mage-guild-detail').evaluate(n=>{const a=[];for(;n;n=n.parentElement)a.push({tag:n.tagName,cls:n.className,touch:getComputedStyle(n).touchAction});return a;});
  assert(!chain.some(n=>n.touch==='none'),'No ancestor blocks native vertical touch scrolling '+JSON.stringify(chain));
  await page.locator('.mage-guild-detail').hover();await page.mouse.wheel(0,200);await page.waitForTimeout(80);
  assert(await page.locator('.mage-guild-detail').evaluate(n=>n.scrollTop>0),'Description actually scrolls');
  if(name==='chromium'&&viewport.width>viewport.height){
   await page.locator('.mage-guild-detail').evaluate(n=>n.scrollTop=0);
   const b=await page.locator('.mage-guild-detail').boundingBox(),session=await page.context().newCDPSession(page);
   const x=b.x+b.width/2,y=b.y+b.height-24;
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=8;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*12}]});await page.waitForTimeout(20);}
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();await page.waitForTimeout(80);
   assert(await page.locator('.mage-guild-detail').evaluate(n=>n.scrollTop>0),'Trusted touch drag scrolls description');
  }
  assert.equal(await page.locator('.mage-guild-title-art').count(),0); // Unknown fixture faction has no building art.

  await page.locator('[data-guild-view]').click();
  await page.waitForTimeout(100);
  const classic=await page.locator('#mobile-scene').evaluate(n=>({inside:!!n.closest('.MuiDialog-paper'),viewport:!!n.closest('.mage-guild-native-viewport'),box:n.getBoundingClientRect().toJSON()}));
  assert(classic.inside&&classic.viewport,'The real native scene belongs to the Material dialog');
  if(viewport.width>viewport.height){assert(classic.box.right<=viewport.width-170);assert(classic.box.height>=viewport.height-24,JSON.stringify({classic,viewport,css:await page.locator('.mobile-mage-guild').evaluate(n=>({box:n.getBoundingClientRect().toJSON(),rows:getComputedStyle(n).gridTemplateRows}))}));}
  await page.locator('[data-guild-view]').click();await page.waitForTimeout(80);
  assert(await page.locator('#mobile-scene').evaluate(n=>!n.closest('.mage-guild-native-viewport')),'Native scene restored on mobile view');
  await page.locator(viewport.width>viewport.height?'[data-ui-rail-close]':'[data-guild-close]').click();
  assert.equal(await page.evaluate(()=>calls.filter(a=>a[0]===0).length),1,'Shared exit delegates exactly once to native guild close');
  await page.screenshot({path:`/tmp/mage-rail-${name}-${language}-${viewport.width}.png`});
 }
 assert.equal(navigations.length,1,'No reload while rotating or changing panels');assert.deepEqual(errors,[]);console.log('PASS',name,'mage-guild full-height spell panes, right-rail stable MUI level selector, plain labels, FR/EN five phone sizes');
 }catch(error){await new Promise(resolve=>setTimeout(resolve,250));fs.writeFileSync('/tmp/phone-shared-failure-'+name+'.json',JSON.stringify({error:String(error),currentCase,events,url:activePage?.url(),closed:activePage?.isClosed(),state:await activePage?.evaluate(()=>({hasSend:typeof window.send,lang:document.documentElement.lang,mode:document.querySelector('#mobile-app')?.dataset.mode,calls:window.calls?.length})).catch(e=>String(e))},null,2));throw error;}finally{await browser.close();}
}
