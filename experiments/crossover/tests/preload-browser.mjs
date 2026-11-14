import {chromium,webkit} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import assert from 'node:assert/strict';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../dist-heroes-starcraft/',import.meta.url));
let requests=0,interrupted=false;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.includes('/starcraft/data/chunks/')&&++requests===4&&!interrupted){interrupted=true;res.writeHead(503);res.end();return;}
 const file=path.join(root,decodeURIComponent(url.pathname.slice('/heroes-starcraft/'.length)));
 try{const stat=fs.statSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size});fs.createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const entry='http://127.0.0.1:'+server.address().port+'/heroes-starcraft/play.html';
try{
for(const [name,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true});
 try{
  const context=await browser.newContext();requests=0;interrupted=false;
  const first=await context.newPage();await first.goto(entry);
  await first.locator('#hosting-retry').waitFor({state:'visible',timeout:60000});assert(interrupted);
  const saved=await first.evaluate(async()=>(await(await caches.open('heroes-starcraft-verified-chunks-v1')).keys()).map(request=>request.url));
  assert(saved.length>0,'verified chunks survive interruption');
  const page=await context.newPage(),transfers=[];
  page.on('request',request=>{if(request.url().includes('/starcraft/data/chunks/'))transfers.push(request.url());});
  await page.goto(entry);await page.waitForFunction(()=>crossOriginIsolated&&location.search.includes('play=1'),null,{timeout:180000});
  await first.close();
  assert(saved.every(url=>!transfers.includes(url)),'another page resumes saved chunks instead of downloading them again');
  const remaining=await page.evaluate(async()=>(await(await caches.open('heroes-starcraft-verified-chunks-v1')).keys()).length);
  assert.equal(remaining,0,'chunks are released after verified archives are installed');
  console.log(name+': interrupted installation resumes verified chunks; completed archives persist without duplicate chunk storage');
 }finally{await browser.close();}
}

}finally{await new Promise(resolve=>server.close(resolve));}
