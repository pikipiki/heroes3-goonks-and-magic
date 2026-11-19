import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/header-close',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><style>#mobile-app{position:fixed;inset:0;display:block!important;container:goonk-viewport/size}.mobile-sheet{position:absolute!important;inset:0!important}</style><section id=mobile-app data-mode=town></section><script type=module>import{renderMarkup,useScreenComponents}from"/web/ui/material-components.mjs";const app=document.querySelector("#mobile-app");renderMarkup(app,`<section class="mobile-sheet"><header class="sheet-head"><button data-leading aria-label="Menu">☰</button><button data-ui="sheet-back">Back</button><h2>Window title</h2><button data-ui="close-sheet" aria-label="Close">✕</button></header><div class="sheet-body">Content</div></section>`);useScreenComponents(app.querySelector(".mobile-sheet"));window.ready=true;</script>'}));
  await page.goto('http://localhost/header-close');await page.waitForFunction(()=>window.ready);
  for(const size of[{width:320,height:568},{width:390,height:844},{width:716,height:279},{width:844,height:390}]){
   await page.setViewportSize(size);await page.waitForTimeout(50);
   assert.equal(await page.locator('.ui-header-close-control').count(),1,'Only the identified close receives the marker');
   const close=page.locator('[data-ui=close-sheet]');assert(await close.evaluate(node=>node.classList.contains('ui-header-close-control')));
   assert.equal(await close.getAttribute('data-ui-header-close'),null,'Native close does not acquire synthetic delegation semantics');
   assert.equal(await page.locator('[data-leading]').evaluate(node=>node.classList.contains('ui-header-close-control')),false,'Menu icon remains a leading action');
   assert.equal(await page.locator('[data-ui=sheet-back]').evaluate(node=>node.classList.contains('ui-header-close-control')),false,'Back never receives close alignment');
   const menu=await page.locator('[data-leading]').boundingBox(),title=await page.locator('h2').boundingBox(),exit=await close.boundingBox();
   assert(menu&&title&&exit&&menu.x<title.x&&title.x+title.width<=exit.x+1,'Leading icon, title and close retain their order');
   assert(exit.x+exit.width<=size.width+1&&exit.y>=0,'Close remains inside viewport');
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'dedicated close marker preserves menu/back semantics and header order');
 }finally{await browser.close();}
}
