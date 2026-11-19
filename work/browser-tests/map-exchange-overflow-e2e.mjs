import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const results=[];
for(const [kind,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{for(const language of ['fr','en'])for(const viewport of [{width:390,height:844},{width:716,height:279}]){
  const page=await browser.newPage({viewport,hasTouch:true}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/web/**',route=>route.fulfill({path:process.env.TEST_CONTROLS&&new URL(route.request().url()).pathname==='/web/ui/controls.mjs'?process.env.TEST_CONTROLS:path.resolve('web',new URL(route.request().url()).pathname.split('/web/')[1])}));
  await page.route('**/exchange-overflow',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/ui/components.css><style>html,body{margin:0;background:#241a10}#mobile-app{position:fixed;inset:0;container:goonk-viewport/size}.mobile-nav{position:absolute;bottom:8px;left:8px;right:8px;display:flex;gap:8px}.ui-map-compact{left:auto;width:280px}</style><div id=mobile-app data-mode=map><nav class=mobile-nav></nav></div><script type=module>import{renderMarkup}from'/web/ui/material-components.mjs';import{useNavigation}from'/web/ui/controls.mjs';import{setLanguage}from'/web/i18n.mjs';setLanguage('${language}');window.calls=[];const nav=document.querySelector('nav');nav.addEventListener('click',event=>{const action=event.target.closest('[data-ui]');if(action)calls.push(action.dataset.ui)});window.refresh=()=>useNavigation(nav);window.show=exchange=>{renderMarkup(nav,'<button data-ui=move class=primary>Move</button><button data-ui=heroes>Troops</button><button data-ui=towns>Towns</button>'+(exchange?'<button data-ui=hero-exchange class=primary>${language==='fr'?'Échanger':'Exchange'}</button>':'')+'<button data-ui=endturn>End turn</button>');refresh()};window.show(false);window.ready=true;</script>`}));
  await page.goto('http://localhost/exchange-overflow');await page.waitForFunction(()=>window.ready);
  assert.equal(await page.locator('[data-ui=hero-exchange]').count(),0);
  for(let cycle=0;cycle<3;cycle++){
   await page.evaluate(()=>show(true));
   await page.evaluate(()=>{for(let i=0;i<12;i++)refresh()});
   const more=page.locator('.ui-overflow-trigger'),exchange=page.locator('[data-ui=hero-exchange]');
   assert.equal(await more.count(),1,'One shared More control');
   assert(await exchange.isHidden(),'Dynamic exchange remains inside closed More after repeated snapshots');
   assert.equal(await exchange.evaluate(node=>node.parentElement.getAttribute('role')),'menu');
   const before=await more.boundingBox();await more.tap();
   assert(await page.locator('.MuiMenu-root').isVisible(),'Actual MUI Menu');
   await page.evaluate(()=>{for(let i=0;i<4;i++)refresh()});
   assert(await exchange.isVisible(),'Refresh does not close or eject the live action');
   await exchange.tap();assert.deepEqual(await page.evaluate(()=>calls),Array(cycle+1).fill('hero-exchange'),'Original command fires exactly once');
   const after=await more.boundingBox();assert(Math.abs(before.x-after.x)<=1&&Math.abs(before.y-after.y)<=1,'Action does not shift dock');
   await page.evaluate(()=>show(false));assert.equal(await exchange.count(),0,'Disappearing native availability removes stale action');
  }
  assert.deepEqual(errors,[]);results.push({kind,language,viewport,cycles:3});await page.close();
 }}finally{await browser.close()}
}
fs.writeFileSync(process.env.TEST_REPORT||'/tmp/map-exchange-overflow-result.json',JSON.stringify(results,null,2));
console.log('PASS',results.length,'map exchange cases, repeated refresh, dynamic availability, MUI Menu, one delegated command');
