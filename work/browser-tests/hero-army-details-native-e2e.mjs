import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 // The public CSP allows the deployment domain; localhost is only a native test host.
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});page.setDefaultTimeout(120000);
 const wait=f=>page.waitForFunction(f,null,{timeout:120000});
 const cmd=(...a)=>page.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
 await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 console.log('Engine ready');
 // Use the small showcase in memory; hidden test scenarios are intentionally absent from the public picker.
 await page.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fs.readFileSync('maps/000-Goonk.vmap')]);
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);
 await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.heroName);
 console.log('Map ready');await page.screenshot({path:'/tmp/review-native-map.png'});
 await page.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero');
 await page.locator('[data-hero-tab=army]').tap();await page.locator('[data-army-slot]:not(.hero-army-empty)').first().tap();
 await page.locator('[data-hero-army-details]').tap();await wait(()=>goonkMobileState.mode==='creature'&&goonkMobileState.previewUnits?.some(u=>u.preview?.w));
 const pictures=new Set();for(let i=0;i<8;i++){await page.waitForTimeout(150);pictures.add(crypto.createHash('sha256').update(await page.locator('.creature-stage canvas').screenshot()).digest('hex'));}
 assert(pictures.size>1,'Native creature detail animates');
 await page.screenshot({path:'/tmp/review-native-creature.png'});
 await page.locator('[data-presentation-close]').tap();await wait(()=>goonkMobileState.mode==='hero');
 await page.locator('[data-army-slot]:not(.hero-army-empty) .hero-army-slot-art').first().tap();await wait(()=>goonkMobileState.mode==='creature');
 await page.locator('[data-presentation-close]').tap();await wait(()=>goonkMobileState.mode==='hero');
 await page.screenshot({path:'/tmp/review-native-army.png'});
 assert.deepEqual(errors,[]);console.log('PASS native hero army Details, animated creature, return to hero and portrait tap');
}catch(error){for(const page of browser.contexts().flatMap(c=>c.pages())){console.log(await page.evaluate(()=>({mode:window.goonkMobileState?.mode,recovery:window.goonkSessionRecovery,creature:window.goonkMobileState?.creatureUnit})));await page.screenshot({path:'/tmp/review-native-failure.png'});}throw error;}finally{await browser.close();}
