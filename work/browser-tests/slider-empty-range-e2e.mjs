import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:360,height:640}});
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return route.fulfill({path:file})});
  await page.route('**/fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/web/ui/tokens.css"><style>main{width:240px;margin:24px}</style><main></main>'}));
  await page.goto('http://localhost/fixture');
  await page.evaluate(async()=>{const ui=await import('/web/ui/mui-runtime.mjs');window.ui=ui;ui.renderMarkup(document.querySelector('main'),'<input id="amount" type="range" min="0" max="0" value="0" aria-label="Quantity" disabled>');window.events=[];for(const name of['input','change'])document.querySelector('main').addEventListener(name,event=>events.push([name,event.target.value]));});
  const state=()=>page.locator('.MuiSlider-root').evaluate(n=>({left:n.querySelector('.MuiSlider-thumb').style.left,track:n.querySelector('.MuiSlider-track').style.width,value:n.querySelector('input').value,max:n.querySelector('input').max,aria:n.querySelector('input').getAttribute('aria-valuemax'),disabled:n.querySelector('input').disabled}));
  assert.deepEqual(await state(),{left:'0%',track:'0%',value:'0',max:'0',aria:'0',disabled:true});
  await page.evaluate(()=>{const n=document.getElementById('amount');n.max='10';n.disabled=false;n.value='5';ui.syncMaterialFields(document.body)});
  assert.equal((await state()).left,'50%');assert.equal((await state()).value,'5');assert.equal((await state()).disabled,false);
  await page.locator('#amount').focus();await page.keyboard.press('ArrowRight');assert.equal((await state()).value,'6');
  assert.deepEqual(await page.evaluate(()=>events),[['input','6'],['change','6']]);
  await page.evaluate(()=>{const n=document.getElementById('amount');n.max='0';n.value='0';n.disabled=true;ui.syncMaterialFields(document.body)});
  assert.deepEqual(await state(),{left:'0%',track:'0%',value:'0',max:'0',aria:'0',disabled:true});
  await page.evaluate(()=>{const n=document.getElementById('amount');n.max='4';n.value='0';n.disabled=false;ui.syncMaterialFields(document.body)});
  assert.equal((await state()).left,'0%');assert.equal((await state()).disabled,false);
  console.log('PASS',name,'empty range stays left, native bounds preserved, midpoint/keyboard and stock refill remain functional');
 }finally{await browser.close();}
}
