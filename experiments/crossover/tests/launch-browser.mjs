// Cold-start regression for GitHub Pages (no native COOP/COEP headers).
import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import assert from 'node:assert/strict';
const entry=process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/launch.html';
for(const [name,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
  const started=Date.now();await page.goto(entry);
  await page.waitForFunction(()=>crossOriginIsolated&&location.pathname.endsWith('/game.html'),null,{timeout:15000});
  console.log(name+': isolated game launch in '+(Date.now()-started)+' ms');
  await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:600000});
  await page.locator('#crossover-demo').click();
  await page.waitForFunction(()=>!!window.goonkMobileState?.crossover,null,{timeout:180000});
  const iframe=await page.locator('#crossover-arena iframe').elementHandle();assert(iframe);
  const sc=await iframe.contentFrame();assert(sc);await sc.waitForURL('**/starcraft/index.html*',{timeout:30000});
  await sc.waitForFunction(()=>!!window.openbwCrossover?.battle(),null,{timeout:180000});
  assert.equal(await sc.evaluate(()=>window.openbwCrossover.battle().frame),0);
  console.log(name+': native Heroes demo and OpenBW are ready');
 }finally{await browser.close();}
}
