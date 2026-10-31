// Serve exactly the public bundle, including a GitHub Pages simulation:
// PORT=8768 BASE_PATH=/heroes-goonk/ ISOLATION_HEADERS=0 node static-server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../dist/',import.meta.url));
const base='/' + (process.env.BASE_PATH||'').split('/').filter(Boolean).join('/') + '/';
const prefix=base==='//'?'/':base;
const port=Number(process.env.PORT||8767);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png'};
http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(prefix!=='/'&&pathname===prefix.slice(0,-1)){res.writeHead(302,{Location:prefix}).end();return;}
  if(!pathname.startsWith(prefix)){res.writeHead(404).end();return;}
  let target;
  try{target=path.resolve(root,decodeURIComponent(pathname.slice(prefix.length))||'index.html');}catch{res.writeHead(400).end();return;}
  if(!target.startsWith(root)){res.writeHead(403).end();return;}
  if(process.env.ISOLATION_HEADERS!=='0'){
    res.setHeader('Cross-Origin-Opener-Policy','same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  }
  if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');
  fs.createReadStream(target).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log('Public build: http://127.0.0.1:'+port+prefix));
