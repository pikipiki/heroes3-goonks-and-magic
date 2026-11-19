import {chromium,webkit} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {silenceTestAudio} from './silent-audio.mjs';
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});try{
  for(const fail of [false,true]){
   const page=await browser.newPage({viewport:{width:320,height:568}});await silenceTestAudio(page);const requests=[],errors=[];page.on('request',r=>requests.push(new URL(r.url()).pathname));page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(fail=>{Object.defineProperty(window,'isSecureContext',{value:!fail});Object.defineProperty(window,'crossOriginIsolated',{value:true});},fail);
   await page.route('http://localhost/**',route=>{const pathname=new URL(route.request().url()).pathname;if(pathname==='/landing')return route.fulfill({body:fs.readFileSync('web/hosting-index.html'),contentType:'text/html'});if(pathname==='/game.html')return route.fulfill({body:'<!doctype html><title>Game ready</title><p>Game ready</p>',contentType:'text/html'});const file=pathname==='/hosting-bootstrap.mjs'?'web/hosting-bootstrap.mjs':pathname.startsWith('/web/')?'.'+pathname:null;if(!file||!fs.existsSync(file))return route.abort();return route.fulfill({path:path.resolve(file),contentType:file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':undefined});});
   await page.goto('http://localhost/landing');
   if(fail){const retry=page.locator('#hosting-retry');await retry.waitFor();assert(await retry.evaluate(n=>n.classList.contains('MuiButton-root')));assert.equal(await retry.getAttribute('type'),'button');assert(await page.locator('#hosting-status').innerText().then(t=>t.includes('HTTPS')));}
   else{await page.waitForURL('**/game.html');assert(!requests.some(p=>p.endsWith('mui-runtime.mjs')),'Successful isolation handoff must not wait for React/MUI');}
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS',name,'instant isolation handoff; lazy real MUI retry only on error');
 }finally{await browser.close();}
}
