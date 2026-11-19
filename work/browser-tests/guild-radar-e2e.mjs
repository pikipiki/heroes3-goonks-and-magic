import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const output='/tmp/heroes-guild-radar';fs.mkdirSync(output,{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});
 try{
  const p=await browser.newPage({hasTouch:true});const errors=[];p.on('pageerror',error=>errors.push(error.message));
  await p.route('**/web/**',r=>{const f=path.resolve('web',new URL(r.request().url()).pathname.split('/web/')[1]);return fs.existsSync(f)?r.fulfill({path:f}):r.abort();});
  await p.route('**/guild-review',r=>r.fulfill({contentType:'text/html',body:`<html class="goonk-mobile"><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href=/web/mobile.css><link rel=stylesheet href=/web/h3-theme.css><link rel=stylesheet href=/web/mobile-followup.css><style>#mobile-viewport{position:fixed;inset:0;container:goonk-viewport / size}#mobile-app{position:absolute;inset:0;--control-rail:30vw}</style><div id=mobile-viewport><div id=mobile-app><div class=mobile-play></div></div></div><script type=module>import{createTownServices}from'/web/town-services.mjs';window.service=createTownServices({root:document.querySelector('#mobile-app'),command:(...args)=>{window.commands.push(args);service.update({mode:'map'});}});window.commands=[];</script>`}));
  await p.goto('http://localhost/guild-review');await p.waitForFunction(()=>window.service);
  for(const language of ['fr','en'])for(const viewport of [{width:320,height:568},{width:360,height:659},{width:716,height:279},{width:568,height:320}]){
   await p.setViewportSize(viewport);
   await p.evaluate(async language=>{const {setLanguage}=await import('/web/i18n.mjs');setLanguage(language);},language);
   await p.evaluate(()=>service.update({mode:'dialog',dialogKind:'thieves-guild',thievesGuild:{players:Array.from({length:8},(_,color)=>({color,hero:'Catherine',personality:'Warrior',primarySkills:[12,13,14,15],creature:'Dragon'})),rows:['Towns','Heroes','Gold','Wood and ore','Rare resources','Obelisks','Artifacts','Army strength','Daily income'].map(label=>({label,ranks:Object.fromEntries(Array.from({length:8},(_,i)=>[i,i+1]))}))}}));
   await p.locator('[data-guild-view="radar"]').click();await p.locator('.guild-radar-chart svg').waitFor();
   assert.equal(await p.locator('.town-service[data-kind="thieves-guild"] [data-service-back]').count(),1);
   assert.equal(await p.locator('.guild-view-tabs .MuiTab-root').count(),3);
   assert.match(await p.locator('.ui-screen-header').innerText(),language==='fr'?/Guilde des voleurs/:/Thieves/);
   assert(await p.locator('.guild-radar').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   await p.locator('.guild-radar [data-guild-player]').evaluate(e=>{e.value='0';e.dispatchEvent(new Event('change',{bubbles:true}));});
   await p.locator('[data-guild-compare]').evaluate(e=>{e.value='7';e.dispatchEvent(new Event('change',{bubbles:true}));});
   await p.waitForFunction(()=>document.querySelector('.guild-radar-legend').textContent.includes('/'));
   await p.locator('.guild-radar [data-guild-player]').evaluate(e=>{e.value='7';e.dispatchEvent(new Event('change',{bubbles:true}));});
   await p.locator('[data-guild-compare]').evaluate(e=>{e.value='0';e.dispatchEvent(new Event('change',{bubbles:true}));});
   assert.equal(await p.locator('[data-guild-series="0"]').innerText(),language==='fr'?'Rose':'Pink');
   await p.screenshot({path:`${output}/${engine.name()}-${language}-${viewport.width}x${viewport.height}.png`});
   await p.locator('[data-guild-view="rankings"]').click();
   assert.equal(await p.locator('.guild-rankings thead th').count(),9);
   assert(await p.locator('.guild-rankings').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   assert.equal(await p.locator('.guild-rankings tbody tr').count(),9);
   await p.locator('[data-guild-view="intelligence"]').click();assert.match(await p.locator('.guild-profile').innerText(),/Catherine/);
   await p.locator('[data-service-back]').click();await p.waitForFunction(()=>getComputedStyle(document.querySelector('.town-service[data-kind="thieves-guild"]')).display==='none');
  }
  await p.evaluate(()=>service.update({mode:'dialog',dialogKind:'thieves-guild',thievesGuild:{players:[{color:0},{color:1}],rows:[{label:'Gold',ranks:{0:1}},{label:'Heroes',ranks:{0:2}},{label:'Towns',ranks:{0:1}}]}}));
  await p.locator('[data-guild-view="radar"]').click();await p.locator('[data-guild-compare]').evaluate(e=>{e.value='1';e.dispatchEvent(new Event('change',{bubbles:true}));});
  assert(await p.locator('.guild-radar-chart').isHidden());assert.equal(await p.locator('.guild-radar-summary li').count(),0);
  assert.deepEqual(errors,[]);console.log(`PASS ${engine.name()}: guild radar/table/details, 8 players, unknown ranks, portrait/landscape, close visibility`);
 }finally{await browser.close();}
}
