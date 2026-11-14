// Cold-start regression for GitHub Pages (no native COOP/COEP headers).
import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import assert from 'node:assert/strict';
const entry=process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/play.html';
for(const [name,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
  const started=Date.now();await page.goto(entry);
  await page.waitForFunction(()=>crossOriginIsolated&&(location.pathname.endsWith('/game.html')||location.search.includes('play=1')),null,{timeout:600000});
  console.log(name+': isolated game launch in '+(Date.now()-started)+' ms');
  await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:600000});
  await page.waitForFunction(()=>!document.querySelector('#crossover-demo')?.disabled,null,{timeout:180000});
  const late=[];
  const heavy=/\/starcraft\/(?:data\/chunks\/|openbw\.wasm|maps\/)/;
  await page.route(heavy,route=>{late.push(route.request().url());return route.abort();});
  await page.locator('#crossover-demo').click();
  await page.waitForFunction(()=>!!window.goonkMobileState?.crossover,null,{timeout:180000});
  const iframe=await page.locator('iframe[data-crossover-engine]').elementHandle();assert(iframe);
  const sc=await iframe.contentFrame();assert(sc);await sc.waitForURL('**/starcraft/index.html*',{timeout:30000});
  await sc.waitForFunction(()=>!!window.openbwCrossover?.battle(),null,{timeout:180000});
  assert.equal(await sc.evaluate(()=>window.openbwCrossover.battle().frame),0);
  await page.locator('#crossover-field').waitFor({state:'visible'});
  assert.deepEqual(late,[],'battle uses prepared archives, map and compiled WASM without fetching them');
  console.log(name+': native Heroes demo and OpenBW are ready; no battle data, map or WASM download');
  await page.unroute(heavy);
  const chunks=[];const observe=request=>{if(request.url().includes('/starcraft/data/chunks/'))chunks.push(request.url());};page.on('request',observe);
  await page.goto(entry);
  await page.waitForFunction(()=>crossOriginIsolated&&location.search.includes('play=1'),null,{timeout:180000});
  assert.deepEqual(chunks,[],'another launch reuses verified archives on this device');
  console.log(name+': next launch reuses the installed archives');
 }finally{await browser.close();}
}
