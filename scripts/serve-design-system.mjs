import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
await import('./build-design-system.mjs');
const root=path.resolve(process.env.HEROES_KIT_OUTPUT||'/tmp/heroes-design-system');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const port=Number(process.env.PORT||8942);
http.createServer((req,res)=>{
 let request;
 try{request=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 const assets=request.startsWith('/web/'),base=assets?path.resolve('web'):root;
 const file=path.resolve(base,assets?request.slice(5):request==='/'?'design-system.html':request.slice(1));
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
 res.setHeader('Cache-Control','no-store');fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`Catalogue : http://127.0.0.1:${port}/design-system.html`));
