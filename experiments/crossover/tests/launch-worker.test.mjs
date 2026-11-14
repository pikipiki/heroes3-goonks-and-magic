import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../../../web/coi-serviceworker.js',import.meta.url),'utf8');
test('cold launch activates and serves an isolated page when CacheStorage is unavailable',async()=>{
 const handlers={},waits=[];let claimed=false,options;
 const scope='https://example.test/heroes-starcraft/';
 const release={id:'test',lazy:true,files:{'game.html':'digest'},htmlVersions:{}};
 const unavailable=async()=>{throw Error('Storage unavailable');};
 const self={registration:{scope},addEventListener:(name,handler)=>{handlers[name]=handler;},clients:{claim:async()=>{claimed=true;}}};
 vm.runInNewContext(source.replace('/* OFFLINE_RELEASE */ null',JSON.stringify(release)),{
  self,URL,Headers,Response,Map,caches:{keys:unavailable,match:unavailable,open:unavailable},
  fetch:async(_request,value)=>{options=value;return new Response('game');}
 });
 handlers.install({waitUntil:promise=>waits.push(promise)});
 assert.equal(waits.length,0,'isolation never waits for shell downloads or cache writes');
 handlers.activate({waitUntil:promise=>waits.push(promise)});await Promise.all(waits);assert(claimed);
 let response;
 handlers.fetch({request:new Request(scope+'game.html'),waitUntil:promise=>waits.push(promise),respondWith:promise=>{response=promise;}});
 const page=await response;await Promise.all(waits);
 assert.equal(await page.text(),'game');assert.equal(page.headers.get('Cross-Origin-Opener-Policy'),'same-origin');
 assert.equal(page.headers.get('Cross-Origin-Embedder-Policy'),'require-corp');
 assert.equal(options.integrity,'sha256-digest');
});
