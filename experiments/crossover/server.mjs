// Isolated preview. Heroes requests use the existing dev server unchanged.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('./public/', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.json':'application/json'};
const upstream = new URL(process.env.HEROES_ORIGIN || 'http://127.0.0.1:8765');
if (upstream.protocol !== 'http:') throw Error('Preview upstream must use HTTP');
http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/crossover') {res.writeHead(302, {Location:'/crossover/'}).end(); return;}
  if (url.pathname.startsWith('/crossover/')) {
    let file;
    try {file = path.resolve(root, decodeURIComponent(url.pathname.slice('/crossover/'.length)) || 'index.html');}
    catch {res.writeHead(400).end(); return;}
    if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404).end(); return;}
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).pipe(res); return;
  }
  // The existing dev server does not resolve the hashed data-loader filename.
  const enginePath = url.pathname.replace(/^\/vcmiclient\.data\.[a-f0-9]{16}\.js$/, '/vcmiclient.data.js');
  const target = new URL((enginePath === '/game.html' ? '/' : enginePath) + url.search, upstream);
  const proxy = http.request(target, {method:req.method, headers:{...req.headers,host:upstream.host}}, response => {
    res.writeHead(response.statusCode, response.headers); response.pipe(res);
  });
  proxy.on('error', () => {
    if (!res.headersSent) res.writeHead(503, {'Content-Type':'text/plain; charset=utf-8'});
    res.end('Heroes indisponible. Lancer npm start dans heroes-goonk, puis réessayer.');
  });
  req.on('aborted', () => proxy.destroy());
  res.on('close', () => proxy.destroy());
  req.pipe(proxy);
}).listen(Number(process.env.PORT || 8774), '127.0.0.1', () => {
  console.log('Crossover: http://127.0.0.1:' + (process.env.PORT || 8774) + '/crossover/');
});
