import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const out=process.env.REVIEW_OUTPUT||'/private/tmp/heroes-starcraft-import-review';fs.mkdirSync(out,{recursive:true});
const result={scope:'Actual Chromium: local archive import, IndexedDB, WASM compilation. Header-only test fixtures; no simulation started.',cases:[]};
let page;
try{
  page=await browser.newPage({viewport:{width:1024,height:768}});await silenceTestAudio(page);
  const requests=[],errors=[];
  page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('pageerror',e=>errors.push(e.message));
  const url=process.env.STARCRAFT_URL||'http://127.0.0.1:8778/crossover/starcraft/index.html';
  const origin=new URL(url).origin;
  await page.route('**/starcraft/data/manifest.json',route=>route.fulfill({status:404,body:'Development import test: no hosted manifest'}));
  await page.goto(url);
  await page.waitForFunction(()=>document.querySelector('#archive-status').textContent.includes('À importer'));
  assert.equal(await page.locator('#start-game').isDisabled(),true);
  const abi=await page.evaluate(async()=>{
    const response=await fetch('./openbw.wasm');if(!response.ok)throw Error('WASM fetch failed');
    const module=await WebAssembly.compile(await response.arrayBuffer());
    return WebAssembly.Module.exports(module).map(v=>v.name);
  });
  assert(abi.includes('openbw_init'));assert(abi.includes('openbw_post_message'));
  result.cases.push('Real OpenBW module fetched and compiled under active CSP; Start disabled without archives');
  const header=Buffer.alloc(32);header.writeUInt32LE(0x1a51504d,0);header.writeUInt32LE(32,4);header.writeUInt32LE(32,8);
  const file=name=>({name,mimeType:'application/octet-stream',buffer:header});
  await page.locator('#archive-files').setInputFiles([file('StarDat.MPQ')]);
  await page.waitForFunction(()=>document.querySelector('#archive-status').textContent.includes('broodat.mpq'));
  assert.equal(await page.locator('#start-game').isDisabled(),true);
  await page.locator('#archive-files').setInputFiles([file('BrooDat.mpq'),file('Patch_rt.mpq')]);
  await page.waitForFunction(()=>document.querySelector('#start-game').disabled===false);
  result.cases.push('Partial then complete local import updates missing archives and enables Start');
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#archive-status').textContent.includes('Trois archives vérifiées'));
  assert.equal(await page.locator('#start-game').isEnabled(),true);
  result.cases.push('IndexedDB import survives reload and integrity is rechecked');
  await page.locator('#archive-files').setInputFiles([{name:'StarDat.mpq',mimeType:'application/octet-stream',buffer:Buffer.from('invalid')}]);
  await page.waitForFunction(()=>document.querySelector('#archive-status').textContent.includes('Taille MPQ invalide'));
  assert.equal(await page.locator('#start-game').isEnabled(),true);
  result.cases.push('Rejected import preserves all previous archives and playable gate');
  await page.evaluate(async()=>{
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('heroes-starcraft-audited-assets-v2',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    await new Promise((resolve,reject)=>{const tx=db.transaction('archives','readwrite'),store=tx.objectStore('archives'),r=store.get('stardat.mpq');r.onsuccess=()=>{const row=r.result;new Uint8Array(row.bytes)[0]=0;store.put(row);};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();
  });
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#archive-status').textContent.includes('Archive altérée'));
  assert.equal(await page.locator('#start-game').isDisabled(),true);
  await page.locator('#archive-files').setInputFiles([file('StarDat.mpq')]);
  await page.waitForFunction(()=>document.querySelector('#archive-status').textContent.includes('Trois archives vérifiées'));
  result.cases.push('Corrupted cached data blocks Start; reimport restores it');
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1024,height:768}]){
    await page.setViewportSize(viewport);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const input=page.locator('#archive-files');await input.scrollIntoViewIfNeeded();assert(await input.isVisible());
  }
  assert(requests.every(r=>new URL(r.url).origin===origin),'No third-party fetch');
  assert(!requests.some(r=>r.method==='POST'),'No file upload');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:out+'/archive-import.png',fullPage:true});
  result.cases.push('Phone/landscape/desktop import reachable; no remote request, upload or JS page error');result.passed=true;
}catch(e){result.passed=false;result.error=String(e);process.exitCode=1;await page?.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));await browser.close();}
console.log(JSON.stringify(result,null,2));
