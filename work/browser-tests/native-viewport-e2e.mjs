import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage();
  await page.route('**/web/**',r=>{const file=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?r.fulfill({path:file}):r.abort();});
  await page.route('**/native-viewport',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><div id=origin><canvas id=native></canvas></div><div id=target></div><script type=module>import{createNativeViewport}from"/web/ui/native-viewport.mjs";window.native=document.querySelector("#native");window.target=document.querySelector("#target");window.viewport=createNativeViewport(native,{className:"native-test ui-screen-content"});window.ready=true;</script>'}));
  await page.goto('http://localhost/native-viewport');await page.waitForFunction(()=>window.ready);
  for(let cycle=0;cycle<3;cycle++){
   const result=await page.evaluate(async()=>{viewport.mount(target);const first=viewport.element;let mutations=0;const observer=new MutationObserver(r=>mutations+=r.length);observer.observe(document.body,{subtree:true,childList:true,attributes:true});for(let i=0;i<50;i++)viewport.mount(target);await new Promise(r=>setTimeout(r,40));observer.disconnect();return{mutations,box:first.classList.contains('MuiBox-root'),sameCanvas:first.firstElementChild===native,one:target.children.length};});
   assert.deepEqual(result,{mutations:0,box:true,sameCanvas:true,one:1});
   await page.evaluate(()=>{window.oldBox=viewport.element;viewport.restore();});await page.waitForTimeout(40);
   assert(await page.evaluate(()=>native.parentNode.id==='origin'&&!oldBox.isConnected&&!viewport.element));
   await page.evaluate(()=>viewport.mount(target));
   assert(await page.evaluate(()=>viewport.element!==oldBox&&viewport.element.classList.contains('MuiBox-root')&&viewport.element.firstElementChild===native));
   await page.evaluate(()=>viewport.restore());await page.waitForTimeout(40);
  }
  console.log('PASS',name,'native viewport mount is mutation-free, fresh MUI Box across restores, original canvas retained');
 }finally{await browser.close();}
}
