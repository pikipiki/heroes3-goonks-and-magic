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
test('independent start scope serves the native game and isolates its root assets',async()=>{
 const handlers={},scope='https://example.test/heroes-starcraft/start.html',fetched=[];
 const release={id:'test',lazy:true,files:{'game.html':'game-digest'},htmlVersions:{}};
 vm.runInNewContext(source.replace('/* OFFLINE_RELEASE */ null',JSON.stringify(release)),{
  self:{registration:{scope},addEventListener:(name,fn)=>{handlers[name]=fn;}},URL,Headers,Response,Map,
  fetch:async(url,options)=>{fetched.push([String(url),options]);return new Response('native game');}
 });
 let result;
 handlers.fetch({request:{url:scope+'?play=1',method:'GET',mode:'navigate',headers:new Headers()},respondWith:promise=>{result=promise;}});
 assert.equal(await(await result).text(),'native game');assert.equal(fetched[0][0],'https://example.test/heroes-starcraft/game.html');
 assert.equal(fetched[0][1].integrity,'sha256-game-digest');
 handlers.fetch({request:new Request('https://example.test/heroes-starcraft/web/mobile-render.mjs'),respondWith:promise=>{result=promise;}});
 assert.equal((await result).headers.get('Cross-Origin-Embedder-Policy'),'require-corp');
});

test('recovery launch registers isolation for dedicated engine workers at the root too',async()=>{
 const entry=fs.readFileSync(new URL('../public/crossover-entry.mjs',import.meta.url),'utf8'),registrations=[],controller={state:'activated'},rootWorker={state:'activated'},values=new Map();let reloaded=false;
 const navigator={serviceWorker:{controller,register:async(_url,{scope})=>{registrations.push(scope);return{active:scope==='./'?rootWorker:controller,update:async()=>{}};}}};
 const location={href:'https://example.test/heroes-starcraft/battle.html',pathname:'/heroes-starcraft/battle.html',reload:()=>{reloaded=true;}};
 const elements={'#hosting-status':{},'#hosting-retry':{}};
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction('document','navigator','location','sessionStorage','isSecureContext','crossOriginIsolated','URL','setTimeout','clearTimeout',entry)({querySelector:key=>elements[key]},navigator,location,{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},true,false,URL,setTimeout,clearTimeout);
 assert.deepEqual(registrations,['./battle.html','./']);assert(reloaded);
});
