// Verify a cached launch applies a newer release before entering the game.
import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../../dist-heroes-starcraft/',import.meta.url));
const original=fs.readFileSync(root+'crossover-worker.js','utf8');const release=JSON.parse(original.match(/^const release = (.+);$/m)[1]);
let version=1;
const game=()=>`<!doctype html><html><body data-release="${version}"><canvas id="canvas"></canvas></body></html>`;
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=decodeURIComponent(url.pathname.slice('/heroes-starcraft/'.length));
 if(file==='game.html'){res.setHeader('Content-Type','text/html');res.end(game());return;}
 if(file==='crossover-worker.js'){
  const metadata=structuredClone(release);metadata.id='test-release-'+version;metadata.files['game.html']=crypto.createHash('sha256').update(game()).digest('base64');
  res.setHeader('Content-Type','text/javascript');res.setHeader('Cache-Control','no-store');res.end(original.replace(/^const release = (.+);$/m,'const release = '+JSON.stringify(metadata)+';'));return;
 }
 try{const filename=path.join(root,file),stat=fs.statSync(filename);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size});fs.createReadStream(filename).pipe(res);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const entry=`http://127.0.0.1:${server.address().port}/heroes-starcraft/battle.html`;
try{
 for(const [name,type]of Object.entries({chromium,webkit})){
  version=1;const browser=await type.launch({headless:true});
  try{
   const page=await browser.newPage();await page.goto(entry);await page.locator('body[data-release="1"]').waitFor({timeout:60000});
   assert(await page.evaluate(()=>crossOriginIsolated));
   version=2;await page.goto(entry+'?update=2');await page.locator('body[data-release="2"]').waitFor({timeout:60000});
   assert(await page.evaluate(()=>crossOriginIsolated));
   console.log(name+': cached entry activates a newer release and enters its game without a reload loop');
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
