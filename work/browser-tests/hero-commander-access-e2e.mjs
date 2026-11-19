import{chromium,webkit}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{screenCases,stateFor}from'./material-screen-cases.mjs';import{silenceTestAudio}from'./silent-audio.mjs';
const output=process.env.REVIEW_OUTPUT||'/tmp/goonk-hero-commander-access';fs.mkdirSync(output,{recursive:true});
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true,serviceWorkers:'block'}),errors=[];page.on('pageerror',error=>errors.push(error.message));await silenceTestAudio(page);
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/opfs-worker.js',route=>route.fulfill({contentType:'text/javascript',body:'export const opfsList=async()=>({}),opfsUnlink=async()=>{},opfsFlush=async()=>{};'}));
  await page.route('**/hero-fixture?mobile=1',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><canvas id=canvas width=800 height=600></canvas><script>window.calls=[];Module={_vcmiMobileEnable(){},_vcmiMobileCommand(...args){calls.push(args)}};</script><script type=module src=/web/mobile.mjs></script>'}));
  await page.goto('http://localhost/hero-fixture?mobile=1');await page.waitForSelector('#mobile-app');await page.evaluate(()=>window.send=model=>dispatchEvent(new CustomEvent('goonk-state',{detail:structuredClone(model)})));
  for(const language of['fr','en'])for(const viewport of[{width:316,height:640},{width:390,height:844},{width:716,height:279}]){
   await page.setViewportSize(viewport);await page.evaluate(async language=>(await import('/web/i18n.mjs')).setLanguage(language),language);
   const model=stateFor(screenCases.find(([key])=>key==='hero-worn'));await page.evaluate(model=>{window.model=model;delete window.goonkHeroIconAtlas;send(model);},model);await page.waitForTimeout(280);
   const button=page.locator('[data-hero-commander]'),select=page.locator('.ui-hero-navigation [role=combobox]');await button.waitFor({state:'visible'});
   assert.equal((await button.innerText()).trim(),language==='fr'?'Commandant':'Commander');assert(await button.locator('img').isVisible(),'Fallback stays visible before native atlas');assert(await button.evaluate(n=>n.matches('.MuiButton-root')&&!n.closest('[inert],[hidden],[aria-hidden=true]')));
   const geometry=await button.evaluate(n=>{const rect=n=>n.getBoundingClientRect().toJSON(),nav=n.parentElement;return{button:rect(n),select:rect(nav.querySelector('[role=combobox]')),nav:rect(nav),overflow:n.scrollWidth>n.clientWidth};});
   assert.equal(geometry.button.height,48);assert(geometry.button.width>=48&&!geometry.overflow,'Whole label and icon fit touch target');assert(geometry.button.x>=geometry.select.right-1,'Commander does not overlap section selector');assert(geometry.button.right<=geometry.nav.right+1);assert(geometry.button.bottom<=viewport.height);
   await page.screenshot({path:path.join(output,`${name}-${language}-${viewport.width}.png`)});
   await page.evaluate(()=>{const atlas=document.createElement('canvas');atlas.width=atlas.height=48;atlas.getContext('2d').fillRect(0,0,48,48);window.goonkHeroIconAtlas=atlas;});await page.waitForFunction(()=>!document.querySelector('[data-hero-commander] canvas')?.hidden);assert(await button.locator('img').isHidden(),'Native icon replaces fallback after atlas paint');
   await page.evaluate(()=>window.before=calls.length);await button.tap();assert.deepEqual(await page.evaluate(()=>calls.slice(before).map(args=>args[0])),[85],'Single tap retains native commander command85');
   await page.evaluate(state=>send(state),stateFor(screenCases.find(([key])=>key==='commander')));await page.locator('.dialog-presentation[data-kind=commander].MuiDialog-paper').waitFor({state:'visible'});
   await page.evaluate(()=>send({mode:'map',resources:model.resources,turn:true}));await page.waitForTimeout(250);
   await page.evaluate(()=>send({...model,heroWindow:{...model.heroWindow,picked:{name:'Artifact'}}}));await page.waitForTimeout(120);assert(await button.isDisabled(),'Held artifact preserves native disabled state');
   await page.evaluate(()=>{const heroWindow={...model.heroWindow};delete heroWindow.commanderIcon;send({...model,heroWindow});});await page.waitForTimeout(120);assert.equal(await button.count(),0,'Heroes without a native commander do not gain a false action');
   await page.evaluate(()=>send({mode:'map',resources:model.resources,turn:true}));await page.waitForTimeout(250);
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'Commander visible/actionable, fallback, native command85 once, disabled/unavailable, FR/EN portrait/landscape');
 }finally{await browser.close();}
}
