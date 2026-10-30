import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeManifest,describeFile} from '../../scripts/assets.mjs';
import {renderPage} from '../../scripts/page.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const root=path.join(project,'work/vcmi-wasm/emscripten/html5');
const data=path.join(project,'work/game-data/homm3eng/home/web_user/.local/share/vcmi');
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.wasm':'application/wasm','.png':'image/png','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
 res.setHeader('Cache-Control','no-cache');const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(renderPage(root));}
 if(url.pathname==='/asset-manifest.json'||url.pathname==='/test-manifest'){const manifest=makeManifest(data);res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(url.pathname==='/test-manifest'?manifest.files.map(f=>f.path):manifest));}
 const isData=url.pathname.startsWith('/assets/data/'),isLegacy=url.pathname.startsWith('/test-data/'),isWeb=url.pathname.startsWith('/web/');
 let relative;try{relative=decodeURIComponent(isData?url.pathname.split('/').slice(4).join('/'):isLegacy?url.pathname.slice(11):url.pathname.slice(1));}catch{res.statusCode=400;return res.end();}
 const base=isData||isLegacy?data:isWeb?project:root,file=path.resolve(base,relative);
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;return res.end('Not found');}
 const size=fs.statSync(file).size;if(isData){const meta=describeFile(file);if(url.pathname.split('/')[3]!==meta.hash){res.statusCode=409;return res.end('Asset changed');}res.setHeader('Cache-Control','public, max-age=31536000, immutable');}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let start=0,end=size-1;
 if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),size-1):size-1;if(start>end||start>=size){res.statusCode=416;res.setHeader('Content-Range','bytes */'+size);return res.end();}res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);}
 res.setHeader('Content-Length',Math.max(0,end-start+1));if(req.method==='HEAD')return res.end();fs.createReadStream(file,{start,end}).pipe(res);
}).listen(Number(process.env.PORT||8765),'127.0.0.1',()=>console.log('Heroes Goonk: http://127.0.0.1:'+(process.env.PORT||8765)));
