import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {makeManifest,describeFile} from '../../scripts/assets.mjs';
import {renderPage} from '../../scripts/page.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const root=path.join(project,'work/vcmi-wasm/emscripten/html5');
const data=path.join(project,'work/game-data/homm3eng/home/web_user/.local/share/vcmi');
// Serve the current mod sources, including when this preview predates a web release.
for (const name of fs.readdirSync(path.join(project,'mod')).filter(name=>fs.statSync(path.join(project,'mod',name)).isDirectory())) {
 const source=path.join(project,'mod',name);
 if(fs.existsSync(source))fs.cpSync(source,path.join(data,'Mods',name),{recursive:true});
}

function getEngineBuild(){
 const runtimeNames={};
 for(const name of ['vcmiclient.data.js','vcmiclient.wasm','vcmiclient.data','vcmiclient.js']){
  const filePath=path.join(root,name);
  if(fs.existsSync(filePath)){
   const bytes=fs.readFileSync(filePath);
   const hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16);
   runtimeNames[name]=name.replace(/(\.[^.]+)$/,'.'+hash+'$1');
  }
 }
 const wasmPath=path.join(root,'vcmiclient.wasm');
 const wasmBytes=fs.readFileSync(wasmPath);
 const wasmSha256=crypto.createHash('sha256').update(wasmBytes).digest('hex');
 const wasmHashed=runtimeNames['vcmiclient.wasm']||`vcmiclient.${wasmSha256.slice(0,16)}.wasm`;
 const engine={
  memoryVersion:1,
  runtimeVersion:wasmSha256.slice(0,16),
  wasm:wasmHashed,
  sha256:wasmSha256,
  mobile:{width:800,height:600},
  assetCacheBytes:16*1024*1024
 };
 return {runtimeNames,engine};
}

const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.wasm':'application/wasm','.png':'image/png','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
 res.setHeader('Cache-Control','no-cache');const url=new URL(req.url,'http://localhost');
 const {runtimeNames,engine}=getEngineBuild();
 if(url.pathname==='/'){
  let html=renderPage(root);
  html=html.replace(/vcmiclient\.(?:data\.js|wasm|data|js)/g,name=>runtimeNames[name]||name);
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.end(html);
 }
 if(url.pathname==='/asset-manifest.json'||url.pathname==='/test-manifest'){
  const manifest=makeManifest(data);
  manifest.engine=engine;
  res.setHeader('Content-Type','application/json');
  return res.end(JSON.stringify(url.pathname==='/test-manifest'?manifest.files.map(f=>f.path):manifest));
 }
 const isData=url.pathname.startsWith('/assets/data/'),isLegacy=url.pathname.startsWith('/test-data/'),isWeb=url.pathname.startsWith('/web/'),isSW=url.pathname==='/coi-serviceworker.js';
 let relative;try{relative=decodeURIComponent(isData?url.pathname.split('/').slice(4).join('/'):isLegacy?url.pathname.slice(11):isSW?'web/coi-serviceworker.js':url.pathname.slice(1));}catch{res.statusCode=400;return res.end();}
 const runtimeMatch=relative.match(/^vcmiclient\.[a-f0-9]{16}\.(data\.js|wasm|data|js)$/);
 if(runtimeMatch)relative='vcmiclient.'+runtimeMatch[1];
 const base=isData||isLegacy?data:isWeb||isSW?project:root,file=path.resolve(base,relative);
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;return res.end('Not found');}
 const size=fs.statSync(file).size;if(isData){const meta=describeFile(file);if(url.pathname.split('/')[3]!==meta.hash){res.statusCode=409;return res.end('Asset changed');}res.setHeader('Cache-Control','public, max-age=31536000, immutable');}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let start=0,end=size-1;
 if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),size-1):size-1;if(start>end||start>=size){res.statusCode=416;res.setHeader('Content-Range','bytes */'+size);return res.end();}res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);}
 res.setHeader('Content-Length',Math.max(0,end-start+1));if(req.method==='HEAD')return res.end();fs.createReadStream(file,{start,end}).pipe(res);
}).listen(Number(process.env.PORT||8765),'127.0.0.1',()=>console.log('Heroes Goonk: http://127.0.0.1:'+(process.env.PORT||8765)));
