import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-purchase-context-stack';fs.mkdirSync(out,{recursive:true});
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/web/**',route=>{const file=path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1]);return fs.existsSync(file)?route.fulfill({path:file}):route.abort();});
  await page.route('**/purchase-stack',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><style>#mobile-app{position:fixed;inset:0;display:block!important;container:goonk-viewport/size}#mobile-app .mobile-sheet,#mobile-app .progression-page{position:absolute!important;inset:8px!important;display:flex!important;flex-direction:column!important}#mobile-app .progression-page{z-index:20}#mobile-app [hidden]{display:none!important}</style><section id=mobile-app data-mode=town data-sheet=army></section><script type=module>import{renderMarkup,useScreenComponents}from"/web/ui/material-components.mjs";import{renderMaterialSelect}from"/web/ui/mui-runtime.mjs";import{renderResources}from"/web/resources.mjs";import{usePurchaseContext}from"/web/ui/purchase-context.mjs";import{useModalBoundary}from"/web/ui/modal-boundary.mjs";const app=document.querySelector("#mobile-app");renderMarkup(app,`<header class="mobile-top"><div class="mobile-resources"></div></header><section class="mobile-sheet" role="dialog" aria-modal="true"><header class="sheet-head"><h2>Army</h2><button data-ui="close-sheet">✕</button></header><div class="sheet-body">Parent army</div></section><section class="progression-page army-upgrades-page" role="dialog" aria-modal="true" hidden><header><h2>Upgrade army</h2><button data-army-upgrade-cancel>✕</button></header><p>Child purchase</p></section>`);window.parentPanel=app.querySelector(".mobile-sheet");window.childPanel=app.querySelector(".progression-page");const selectHost=document.createElement("div");selectHost.id="stack-select-host";childPanel.append(selectHost);renderMaterialSelect(selectHost,{label:"Active purchase filter",value:"all",options:[{value:"all",label:"All"},{value:"ready",label:"Ready"}],onChange:()=>{}});window.closeCalls=0;window.values=[20,15,20,10,10,10,20000];window.sync=()=>{renderResources(app.querySelector(".mobile-resources"),values);usePurchaseContext(app);};window.showChild=()=>{childPanel.hidden=false;useScreenComponents(childPanel);usePurchaseContext(app);};childPanel.querySelector("button").addEventListener("click",()=>{closeCalls++;childPanel.hidden=true;useScreenComponents(childPanel);usePurchaseContext(app);});useScreenComponents(parentPanel);sync();window.ready=true;</script>'}));
  await page.goto('http://localhost/purchase-stack');await page.waitForFunction(()=>window.ready);
  for(const language of['fr','en'])for(const viewport of[{width:320,height:568},{width:390,height:844},{width:716,height:279},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.evaluate(async language=>(await import('/web/i18n.mjs')).setLanguage(language),language);
   for(const nested of[false,true]){
    await page.evaluate(nested=>{(nested?parentPanel:document.querySelector('#mobile-app')).append(childPanel);showChild();},nested);await page.waitForTimeout(50);
    assert(await page.locator('.mobile-sheet>.sheet-head').evaluate(node=>!!node.closest('[inert],[aria-hidden="true"]')),'Background parent header is isolated by MUI');
    assert.equal(await page.locator('.ui-purchase-resources').count(),1,'One shared budget strip across the stack');
    assert.equal(await page.locator('.army-upgrades-page>header .ui-purchase-resources [role=listitem]').count(),7,'Top purchase owns all native resources');
    assert.equal(await page.locator('.army-upgrades-page>header').evaluate(node=>!!node.closest('[hidden],[inert],[aria-hidden="true"]')),false,'Top purchase stays active');
    await page.evaluate(()=>{values[6]-=10;sync();});
    assert.match(await page.locator('.army-upgrades-page [data-resource=gold]').getAttribute('aria-label'),/19/,'Top budget receives live native amounts');
    await page.evaluate(()=>{const budget=childPanel.querySelector('.ui-purchase-resources');window.originalBudget={node:budget,rect:budget.getBoundingClientRect().toJSON(),text:budget.textContent};});
    await page.getByRole('combobox',{name:'Active purchase filter'}).click();await page.getByRole('listbox').waitFor();
    await page.evaluate(async()=>{const{useScreenComponents}=await import('/web/ui/material-components.mjs');const{usePurchaseContext}=await import('/web/ui/purchase-context.mjs');for(let i=0;i<8;i++){useScreenComponents(childPanel);usePurchaseContext(document.querySelector('#mobile-app'));}});
    assert(await page.evaluate(()=>{const budget=childPanel.querySelector('.ui-purchase-resources'),before=originalBudget;return budget===before.node&&budget.textContent===before.text&&['x','y','width','height'].every(key=>Math.abs(budget.getBoundingClientRect()[key]-before.rect[key])<1);}), 'Select body portal and repeated refresh keep the exact budget node and geometry');
    await page.keyboard.press('Escape');await page.getByRole('listbox').waitFor({state:'hidden'});
    assert(await page.evaluate(()=>childPanel.querySelector('.ui-purchase-resources')===originalBudget.node),'Select dismissal keeps budget mounted');
    await page.screenshot({path:path.join(out,`${name}-${language}-${viewport.width}-${nested?'nested':'siblings'}.png`)});
    const before=await page.evaluate(()=>closeCalls);await page.locator('[data-army-upgrade-cancel]').click();await page.waitForTimeout(50);
    assert.equal(await page.evaluate(()=>closeCalls),before+1,'Top close executes once');
    assert.equal(await page.locator('.ui-purchase-resources').count(),1,'Only one strip after closing the child');
    assert.equal(await page.locator('.mobile-sheet>.sheet-head .ui-purchase-resources [role=listitem]').count(),7,'Budget returns to the active parent');
    assert.equal(await page.locator('.mobile-sheet>.sheet-head').evaluate(node=>!!node.closest('[inert],[aria-hidden="true"]')),false,'Parent becomes interactive again');
   }
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'active purchase header follows sibling/nested modal stack, native deltas and one close FR/EN portrait/landscape');
 }finally{await browser.close();}
}
