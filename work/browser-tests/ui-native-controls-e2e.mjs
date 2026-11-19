// Isolated production adapters: real MUI components and actual DOM command
// listeners, without a game save or engine mutation.
import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [kind,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:360,height:640},hasTouch:true});await silenceTestAudio(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/native-controls',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang=fr><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/ui/material-components.css><div id=mobile-app data-ui-app=heroes><section id=controls></section><section id=dynamic></section><section id=loading></section></div><script type=module>
   import {renderMarkup,createUIElement,createUIField,useScreenComponents} from '/web/ui/material-components.mjs';
   import {syncMaterialFields} from '/web/ui/mui-runtime.mjs';
   import {createLoadingView} from '/web/loading.mjs';
   window.calls=[];const root=document.querySelector('#controls');
   renderMarkup(root,'<button id=initial-disabled disabled>Devis</button><p id=copy>Texte natif</p><label>Quantité<input id=quantity type=number min=0 max=100 value=3></label><label>Case<input id=choice type=checkbox></label><input id=range type=range min=0 max=100 value=20 aria-label=Trajet><progress id=progress max=100 value=0 aria-label=Téléchargement></progress>');
   root.querySelector('#initial-disabled').addEventListener('click',()=>calls.push(['enabled-command']));
   root.addEventListener('input',e=>calls.push(['input',e.target.id,e.target.value]));root.addEventListener('change',e=>calls.push(['change',e.target.id,e.target.checked]));
   const button=createUIElement('button');button.id='dynamic-button';button.className='ui-button';button.textContent='Action native';button.addEventListener('click',()=>calls.push(['click']));document.querySelector('#dynamic').append(button);
   const field=createUIField({type:'checkbox',name:'split',defaultChecked:false});field.input.id='split';field.input.addEventListener('change',()=>calls.push(['split',field.input.checked]));document.querySelector('#dynamic').append(field.element);
   window.sync=()=>syncMaterialFields(document.body);window.ready=true;
   window.download=createLoadingView(document.querySelector('#loading'));
  </script>`}));
  await page.goto('http://localhost/native-controls');await page.waitForFunction(()=>window.ready);
  await page.evaluate(()=>{document.querySelector('#initial-disabled').disabled=false;});await page.waitForFunction(()=>!document.querySelector('#initial-disabled').classList.contains('Mui-disabled'));await page.locator('#initial-disabled').click();assert.deepEqual(await page.evaluate(()=>calls.filter(c=>c[0]==='enabled-command')),[['enabled-command']]);
  assert(await page.locator('#quantity').evaluate(n=>!!n.closest('.MuiInputBase-root')));
  await page.locator('#quantity').fill('7');assert.equal(await page.locator('#quantity').inputValue(),'7');
  await page.locator('#choice').check();assert.equal((await page.evaluate(()=>calls.filter(c=>c[0]==='change'&&c[1]==='choice'))).length,1,'Native change only once');
  await page.locator('#split').check();assert.deepEqual(await page.evaluate(()=>calls.filter(c=>c[0]==='split')),[['split',true]]);
  await page.evaluate(()=>{document.querySelector('#split').disabled=true;sync();});assert(await page.locator('#split').isDisabled());
  const button=page.locator('#dynamic-button');assert(await button.evaluate(n=>n.classList.contains('MuiButton-root')),'Imperative class assignment preserves MUI identity');
  await button.dispatchEvent('mousedown',{button:0});await page.waitForTimeout(60);assert(await button.locator('.MuiTouchRipple-ripple').count(),'Detached factory retains real MUI event delegation and ripple');await button.dispatchEvent('mouseup',{button:0});
  await button.click();assert.equal((await page.evaluate(()=>calls.filter(c=>c[0]==='click'))).length,1);
  const finish=await button.evaluate(n=>{const s=getComputedStyle(n);return{shadow:s.boxShadow,border:s.borderTopWidth,weight:s.fontWeight};});assert.notEqual(finish.shadow,'none');assert(!finish.shadow.includes('inset'));assert.equal(finish.border,'1px');assert.equal(finish.weight,'400');
  await page.locator('#range').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#range').inputValue(),'21');
  await page.evaluate(()=>{document.querySelector('#progress').value=64;});await page.waitForFunction(()=>document.querySelector('#progress').getAttribute('aria-valuenow')==='64');
  await page.evaluate(()=>download({phase:'download',percent:45,loaded:450,totalBytes:1000,speed:100,remaining:1,total:2,reused:1,active:[{file:'folder/asset.def',size:100,loaded:45,state:'download',speed:10}]}));
  await page.waitForFunction(()=>document.querySelector('#asset-loading [role=progressbar]')?.getAttribute('aria-valuenow')==='45');assert.equal(await page.locator('#asset-loading progress').count(),0,'Progress is a MUI component');
  assert.deepEqual(errors,[]);console.log('PASS',kind,'native text/range/choice commands, one activation, imperative MUI ripple, disabled state and live download progress');
 }finally{await browser.close();}
}
