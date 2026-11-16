/** Real service-worker install: transient CDN failure, bounded permanent failure,
 * integrity rejection and successful offline reads in Chromium and WebKit. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {createServer} from 'node:http';
import {chromium,webkit} from 'playwright-core';
import {silenceTestAudio} from './silent-audio.mjs';
const worker=fs.readFileSync('web/coi-serviceworker.js','utf8'),hash=s=>createHash('sha256').update(s).digest('base64');
const html='<!doctype html><meta charset="utf-8"><title>Offline installation control</title>',module='export const release = "verified";';
const blocked=new Set(),cases=new Map(),results=[],out=process.env.REVIEW_OUTPUT||'/tmp/goonk-offline-install-retry';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{
 const [,key,...parts]=new URL(req.url,'http://localhost').pathname.split('/'),name=parts.join('/'),fixture=cases.get(key);
 if(!fixture){res.writeHead(404);res.end();return;}
 if(blocked.has(key)){req.socket.destroy();return;}
 const files={'game.html':html,'web/cache-only.mjs':module},release={id:key,files:Object.fromEntries(Object.entries(files).map(([n,s])=>[n,hash(s)])),htmlVersions:{}};
 let status=200,body=name==='coi-serviceworker.js'?worker.replace('/* OFFLINE_RELEASE */ null',JSON.stringify(release)):files[name];
 if(name==='web/cache-only.mjs'){
  fixture.attempts++;
  if(fixture.kind==='permanent'||fixture.kind==='transient'&&fixture.attempts===1){status=503;body='Temporary CDN failure';}
  if(fixture.kind==='corrupt')body='export const release = "wrong bytes";';
 }
 res.writeHead(body===undefined?404:status,{'Content-Type':name.endsWith('.html')?'text/html':'text/javascript','Cache-Control':'no-store','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp'});res.end(body);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{
 for(const[browserName,engine]of[['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{for(const kind of['transient','permanent','corrupt']){
   const key=browserName+'-'+kind,fixture={kind,attempts:0};cases.set(key,fixture);console.log('Checking',key);
   const context=await browser.newContext(),page=await context.newPage();await silenceTestAudio(page);
   try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/'+key+'/game.html');
    await page.evaluate(async()=>{window.installation=await navigator.serviceWorker.register('./coi-serviceworker.js',{scope:'./',updateViaCache:'none'});const w=installation.installing||installation.waiting||installation.active;window.installState=w.state;w.addEventListener('statechange',()=>window.installState=w.state);});
    await page.waitForFunction(()=>installState==='activated'||installState==='redundant',null,{timeout:30000});
    const installed=await page.evaluate(()=>({state:installState,active:!!installation.active,waiting:!!installation.waiting}));
    if(kind==='transient'){
     assert.equal(installed.state,'activated');assert.equal(fixture.attempts,2);
     await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
     blocked.add(key);assert.equal(await page.evaluate(()=>fetch('./web/cache-only.mjs').then(r=>r.text())),module);
     results.push({browser:browserName,case:kind,passed:true,attempts:fixture.attempts,offlineVerifiedBytes:true});
    }else{
     assert.equal(installed.state,'redundant');assert.equal(installed.active,false);assert.equal(installed.waiting,false);assert.equal(fixture.attempts,3);
     assert.equal(await page.evaluate(async()=>{const prefix='heroes-goonk-shell:'+new URL('./',location.href).pathname+':';return(await caches.keys()).filter(n=>n.startsWith(prefix)).length}),0);
     results.push({browser:browserName,case:kind,passed:true,attempts:fixture.attempts,incompleteCacheRemoved:true,unverifiedReleaseNotActivated:true});
    }
   }finally{await context.close();}
  }}finally{await browser.close();}
 }
 fs.writeFileSync(out+'/result.json',JSON.stringify({passed:true,scope:'Real browser service workers; one503 is retried, permanent503 and SRI mismatch stop after3 attempts, incomplete caches are removed, verified cached bytes work offline.',cases:results},null,2)+'\n');console.log('PASS Chromium and WebKit offline installation retries, integrity and bounded failures');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
