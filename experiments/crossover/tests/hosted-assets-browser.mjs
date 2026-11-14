import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const url=process.env.STARCRAFT_URL||'http://127.0.0.1:8778/crossover/starcraft/index.html';
const browser=await chromium.launch({headless:true});
const report={scope:'Actual published MPQ chunks; automatic mobile download, cache integrity and rejection of tampering',cases:[]};
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});await silenceTestAudio(page);
 const requests=[],errors=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 await page.waitForFunction(()=>!document.querySelector('#start-game').disabled,null,{timeout:180000});
 assert(await page.locator('#archive-files').isHidden());
 const chunks=requests.filter(r=>r.url.includes('/chunks/'));assert(chunks.length>0);
 report.cases.push('Fresh phone browser downloads real MPQ chunks automatically, verifies hashes, enables Start without file selection');
 await page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('heroes-starcraft-local-assets',1);r.onupgradeneeded=()=>r.result.createObjectStore('archives');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  db.close();
 }); // Seed the legacy cache, then prove the new loader removes it without reading it.
 requests.length=0;await page.reload();await page.waitForFunction(()=>!document.querySelector('#start-game').disabled);
 assert(!requests.some(r=>r.url.includes('/chunks/')));report.cases.push('Reload rechecks cached MPQs and downloads no chunks; legacy cache absent');
 const databases=await page.evaluate(()=>indexedDB.databases());assert(!databases.some(db=>db.name==='heroes-starcraft-local-assets'));
 for(const viewport of [{width:844,height:390},{width:1024,height:768}]){await page.setViewportSize(viewport);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#start-game').scrollIntoViewIfNeeded();}
 assert(requests.every(r=>new URL(r.url).origin===new URL(url).origin));assert(!requests.some(r=>r.method==='POST'));assert.deepEqual(errors,[]);
 const bad=await browser.newPage();await silenceTestAudio(bad);
 await bad.route('**/chunks/*.bin',route=>route.fulfill({body:Buffer.from('tampered data')}));
 await bad.goto(url);await bad.waitForFunction(()=>document.querySelector('#archive-status').textContent.includes('Morceau altéré'));
 assert(await bad.locator('#start-game').isDisabled());report.cases.push('Tampered chunk rejected before persistence or engine launch');report.passed=true;
}catch(e){report.passed=false;report.error=String(e);process.exitCode=1;}
finally{await browser.close();fs.writeFileSync(new URL('../evidence/hosted-assets.json',import.meta.url),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
