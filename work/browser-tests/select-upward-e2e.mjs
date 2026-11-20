import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/select-upward',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="fixture" style="position:absolute;left:16px;width:240px"></div><script type="module">import{renderMarkup,createMaterialSelects}from"/web/ui/material-components.mjs";const host=document.querySelector("#fixture");renderMarkup(host,`<select aria-label="Choix">${Array.from({length:24},(_,i)=>`<option value="${i}" ${i===18?"selected":""}>Option ${i}</option>`).join("")}</select>`);createMaterialSelects(host).update();host.querySelector("select").addEventListener("change",()=>window.changes=(window.changes||0)+1);</script>'}));
  for(const size of [{width:320,height:568},{width:390,height:844},{width:716,height:279},{width:844,height:390}])for(const anchorTop of [64,140,size.height-72]){
   await page.setViewportSize(size);await page.goto('http://goonk.test/select-upward');const combo=page.getByRole('combobox');await combo.waitFor();await page.locator('#fixture').evaluate((e,top)=>e.style.top=top+'px',anchorTop);const trigger=await combo.boundingBox();await combo.tap();const expected=(size.height-trigger.y-trigger.height-12>=160||size.height-trigger.y-trigger.height-12>=trigger.y-12)?'down':'up';const menu=page.locator('[data-ui-select-direction='+expected+']');await menu.waitFor();const box=await menu.boundingBox();assert(box.y>=4&&(expected==='up'?box.y+box.height<=trigger.y+1:box.y>=trigger.y+trigger.height-1),'Menu chooses the available side '+JSON.stringify({size,anchorTop,trigger,box}));assert(await menu.evaluate(e=>e.scrollHeight>e.clientHeight),'Long options remain scrollable');await page.keyboard.press('Home');await page.keyboard.press('Enter');await menu.waitFor({state:'hidden'});assert.equal(await page.locator('select').inputValue(),'0');assert.equal(await page.evaluate(()=>changes),1,'One native change from keyboard selection');
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'adaptive Select placement, long-list scroll and native selection at three positions in portrait/landscape');
 }finally{await browser.close();}
}
