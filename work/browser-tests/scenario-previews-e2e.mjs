import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync('web/scenario-previews.json')),paths=Object.keys(data.previews);
for(const [kind,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/web/**',r=>r.fulfill({path:path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1])}));
  await p.route('**/preview-test',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-upgrade.css><link rel=stylesheet href=/web/lobby-choices.css><div id=mobile-app style="display:block"><div id=menu></div></div><script type=module>
  import{createLobbyChoices}from'/web/lobby-choices.mjs';import{setLanguage}from'/web/i18n.mjs';setLanguage('fr');window.nativeCalls=0;window.Module={_vcmiMobilePreviewMap(){nativeCalls++;throw Error('Catalogue browsing must never parse a native map');}};const paths=${JSON.stringify(paths)};const menu=document.querySelector('#menu');const label=document.createElement('label'),select=document.createElement('select');select.id='mobile-map-select';for(const [i,path]of paths.entries())select.add(new Option(path.split('/').at(-1),i));label.append(select);menu.append(label);window.state={mode:'lobby',maps:paths.map((path,index)=>({path,index,name:path,width:144,height:144,players:2,humanSeats:1,castleChoice:1})),selectedMap:paths[0]};window.choices=createLobbyChoices({menu,getState:()=>state});choices.update(state);window.ready=true;
  </script>`}));
  await p.goto('http://localhost/preview-test');await p.waitForFunction(()=>window.ready);
  await p.locator('.lobby-choice-card').click();await p.waitForSelector('.lobby-picker[open]');
  const images=p.locator('.lobby-picker-grid img');assert.equal(await images.count(),357);
  await p.waitForFunction(()=>document.querySelectorAll('.lobby-picker-grid img[data-preview-ready=true]').length===356);
  const first=images.first();await p.waitForFunction(()=>document.querySelector('.lobby-picker-grid img').naturalWidth===128);
  for(const size of [{width:390,height:844},{width:844,height:390}]){
   await p.setViewportSize(size);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await first.scrollIntoViewIfNeeded();
   const r=await first.boundingBox();assert(r.width>=96&&r.width<=128.1&&Math.abs(r.width-r.height)<1,JSON.stringify(r));const card=await first.locator('..').boundingBox();assert(r.x>=card.x&&r.x+r.width<=card.x+card.width);await p.screenshot({path:'/tmp/scenario-previews-'+kind+'-'+size.width+'.png'});
  }
  await p.locator('.lobby-picker input').fill('XL_WARZONE_A');assert.equal(await p.locator('[data-choice-value]:visible').count(),1);assert.equal(await p.locator('.lobby-picker-grid img:not([data-preview-ready])').getAttribute('alt'),'Aperçu indisponible');assert.equal(await p.locator('.lobby-choice-copy[data-preview-error]').getAttribute('data-preview-error'),'Aperçu indisponible');
  await p.locator('.lobby-picker input').fill('');await images.last().scrollIntoViewIfNeeded();await p.waitForFunction(()=>{const images=[...document.querySelectorAll('.lobby-picker-grid img')];return images.at(-1).naturalWidth===128;});
  assert.equal(await p.evaluate(()=>nativeCalls),0);assert.deepEqual(errors,[]);console.log('PASS',kind,'357 preloaded entries, 356 real previews, explicit unavailable map, large stable thumbnails and zero native map loads');
 }finally{await browser.close();}
}
