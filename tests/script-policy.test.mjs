import {test} from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {inlineScriptHashes,scriptPolicy,applyScriptPolicy,authorizeExternalScripts} from '../scripts/script-policy.mjs';
test('Only the exact application scripts are whitelisted; injected inline scripts are excluded',()=>{
 const code='\nwindow.ready = true;\n',html='<html><head></head><body><script>'+code+'</script><script type="module">import x from "./x.mjs";</script><script src="./external.js"></script></body></html>',policy=scriptPolicy([html]);
 assert.equal(inlineScriptHashes(html).length,2);assert(policy.includes("'sha256-"+crypto.createHash('sha256').update(code).digest('base64')+"'"));assert(!policy.includes("'unsafe-inline'"));
 const badge="document.body.innerHTML = 'Powered by Netlify'";assert(!policy.includes(crypto.createHash('sha256').update(badge).digest('base64')));assert(applyScriptPolicy(html,policy).includes('http-equiv="Content-Security-Policy"'));assert(policy.includes("'unsafe-eval'"));assert(policy.includes("'wasm-unsafe-eval'"));
});

test('External application scripts carry matching SRI hashes and only explicit asset paths are authorized',()=>{const result=authorizeExternalScripts('<script type="module" src="./web/start.mjs"></script>',()=>Buffer.from('export const ready=true;'));assert(result.html.includes('integrity="sha256-'));const policy=scriptPolicy([result.html],result.hashes,['https://heroes3-goonks-and-magic.netlify.app/web/']);assert(policy.includes('https://heroes3-goonks-and-magic.netlify.app/web/'));assert(!policy.includes('https://*'));assert(!policy.includes('/.netlify/'));assert(policy.includes(result.hashes[0]));assert(!policy.includes("script-src 'self'"));});
