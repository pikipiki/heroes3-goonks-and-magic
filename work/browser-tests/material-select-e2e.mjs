import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import path from 'node:path';
for(const [kind,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:740},hasTouch:true}),errors=[];
  p.on('pageerror',error=>errors.push(error.message));
  await p.route('**/web/**',route=>route.fulfill({path:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
  await p.route('**/select-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/lobby-choices.css><link rel=stylesheet href=/web/material-select.css><div id=mobile-app><dialog class=lobby-picker><header><h2>Carte d’aventure</h2></header><div class=lobby-picker-content><label>Rechercher<input type=search></label><div class=lobby-picker-grid><article><span class=lobby-choice-name>Petite carte</span></article><article><span class=lobby-choice-name>Grande carte</span></article></div><p class=lobby-picker-empty hidden></p></div><footer><button id=back>Retour</button></footer></dialog></div><script type=module>
 import {setLanguage}from'/web/i18n.mjs';setLanguage('fr');import {mountScenarioFilters}from'/web/scenario-filters.mjs';import {protectTouchClicks}from'/web/mobile-press.mjs';
 const root=document.querySelector('#mobile-app'),dialog=root.querySelector('dialog');root.style.display='block';protectTouchClicks(root);window.filters=mountScenarioFilters(dialog);window.entries=[...document.querySelectorAll('article')].map((row,i)=>({row,map:{width:i?144:36,height:i?144:36,players:i?4:2,humanCounts:[1],castleChoices:i?0:1}}));filters.update(entries,{french:true});document.querySelector('details').open=true;window.changes=0;dialog.addEventListener('change',()=>changes++);window.backs=0;document.querySelector('#back').onclick=()=>backs++;dialog.showModal();window.ready=true;
 </script>`}));
  await p.goto('http://localhost/select-test');await p.waitForFunction(()=>window.ready);
  const trigger=p.locator('[data-filter=size] + .material-select-trigger');
  const immediate=await trigger.evaluate(button=>{const start=performance.now();button.click();return{expanded:button.getAttribute('aria-expanded'),open:document.getElementById(button.getAttribute('aria-controls')).parentElement.matches(':popover-open'),elapsed:performance.now()-start};});
  assert.equal(immediate.expanded,'true');assert(immediate.open,'Menu is open in the same event, without a timer');assert(immediate.elapsed<100,JSON.stringify(immediate));
  await p.getByRole('option',{name:'XL',exact:true}).tap();assert.equal(await p.locator('[data-filter=size]').inputValue(),'XL');assert.equal(await p.evaluate(()=>changes),1);assert.equal(await p.locator('article:not([hidden])').count(),1);assert.match(await trigger.innerText(),/XL/);
  await trigger.tap();assert.equal(await trigger.getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('dialog').evaluate(node=>node.open),true);assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert(await trigger.evaluate(node=>node===document.activeElement));
  await trigger.tap();await p.mouse.click(2,2);assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert.equal(await p.evaluate(()=>backs),0,'Outside dismissal never presses a button underneath');assert.equal(await p.evaluate(()=>changes),1);
  await p.locator('[data-filter-reset]').tap();assert.equal(await p.locator('[data-filter=size]').inputValue(),'');assert.match(await trigger.innerText(),/Indifférent/);assert.equal(await p.locator('article:not([hidden])').count(),2);
  await trigger.focus();await p.keyboard.press('ArrowDown');await p.keyboard.press('End');await p.keyboard.press('Enter');assert.equal(await p.locator('[data-filter=size]').inputValue(),'XL');assert.equal(await p.evaluate(()=>changes),2);
  for(const size of [{width:390,height:740},{width:740,height:390}]){
   await p.setViewportSize(size);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await trigger.tap();const box=await p.getByRole('listbox').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,JSON.stringify(box));await p.screenshot({path:'/tmp/material-select-'+kind+'-'+size.width+'.png'});await p.keyboard.press('Escape');
  }
  await trigger.tap();await p.setViewportSize({width:390,height:740});await p.waitForFunction(()=>document.querySelector('[data-filter=size] + button').getAttribute('aria-expanded')==='false');assert.equal(await trigger.getAttribute('aria-expanded'),'false','Rotation closes the old geometry');
  await p.evaluate(async()=>{(await import('/web/i18n.mjs')).setLanguage('en');filters.update(entries,{french:false});});assert.match(await trigger.getAttribute('aria-label'),/Size/);await trigger.tap();assert(await p.getByRole('option',{name:'Any',exact:true}).isVisible());await p.keyboard.press('Escape');
  await p.evaluate(()=>{document.querySelector('[data-filter=computers]').disabled=true;document.querySelector('[data-filter=size]').value='S';filters.update(entries,{french:false});});assert(await p.locator('[data-filter=computers] + button').isDisabled());assert.equal((await trigger.innerText()).trim(),'S','Native value updates refresh the visible field');
  assert.deepEqual(errors,[]);console.log('PASS',kind,'synchronous opening, touch guard, real filters, keyboard, dismissal, locale and viewport geometry',immediate.elapsed.toFixed(1)+'ms');
 }finally{await browser.close();}
}
