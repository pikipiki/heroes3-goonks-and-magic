// Start the real demo from a PC in both native and responsive Heroes interfaces.
import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
for(const [name,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true});try{for(const mobile of [1,0]){
 const page=await browser.newPage({viewport:{width:1918,height:1000}});await silenceTestAudio(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.CROSSOVER_URL||'http://127.0.0.1:8784/heroes-starcraft/battle.html')+'?mobile='+mobile);await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:180000});const demo=page.locator('#crossover-demo');await demo.waitFor({state:'visible',timeout:15000});assert.equal(await demo.count(),1);const box=await demo.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=1000,'the demo button is on screen');assert.equal(await page.locator('#mobile-app').count(),mobile);await demo.click({timeout:180000});await page.locator('#crossover-field').waitFor({state:'visible',timeout:90000});const sc=page.frames().find(f=>f.url().includes('/starcraft/index.html'));assert(sc);const actors=await sc.evaluate(()=>openbwCrossover.census().units.filter(u=>!u.auxiliary));assert.equal(actors.filter(u=>u.heroes).length,7);assert.equal(actors.filter(u=>!u.heroes).length,12);assert.deepEqual(errors,[]);console.log(name,{mobile},'visible PC menu button starts the real 7-vs-12 demo');await page.close();
 }}finally{await browser.close();}
}
