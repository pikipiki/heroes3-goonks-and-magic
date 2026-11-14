// Separate static publish directory, built from the verified Heroes bundle and crossover.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const input=path.join(root,'dist'),output=path.join(root,'dist-heroes-starcraft');
if(!fs.existsSync(input+'/game.html')||!fs.existsSync(input+'/crossover/starcraft/data/manifest.json'))throw Error('Build and package both games first');
fs.rmSync(output,{recursive:true,force:true});fs.cpSync(input,output,{recursive:true});
fs.cpSync(input+'/crossover',output,{recursive:true});fs.rmSync(output+'/crossover',{recursive:true,force:true});
const base=fs.readFileSync(output+'/game.html','utf8').match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
const scripts=base.split(';')[0].replace(/https?:\/\/[^\s;]+/g,'')+" 'self'";
// OPFS lazy assets read app-created blob URLs through synchronous XHR.
const policy="default-src 'self'; "+scripts+"; worker-src 'self' blob:; connect-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
for(const file of ['game.html','storage.html']){
 const filename=output+'/'+file;fs.writeFileSync(filename,fs.readFileSync(filename,'utf8').replace(/http-equiv="Content-Security-Policy" content="[^"]+"/,`http-equiv="Content-Security-Policy" content="${policy}"`));
}
fs.writeFileSync(output+'/_headers',`/*\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\n  Content-Security-Policy: ${policy}\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/starcraft/data/manifest.json\n  Cache-Control: no-cache\n/starcraft/data/chunks/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
for(const file of ['index.html','app.js']){
 const filename=output+'/'+file;fs.writeFileSync(filename,fs.readFileSync(filename,'utf8').replaceAll('../game.html','./game.html'));
}
fs.copyFileSync(output+'/index.html',output+'/laboratoire.html');
let heroesPage=fs.readFileSync(output+'/game.html','utf8');
heroesPage=heroesPage.replace('</body>','<script type="module" src="./adventure-entry.js"></script></body>');
fs.writeFileSync(output+'/game.html',heroesPage);
fs.writeFileSync(output+'/heroes-entry.js',"const entry=new URL(location.href);entry.searchParams.set('mobile','1');entry.searchParams.set('skip-autoresume','1');history.replaceState(null,'',entry);import('./crossover-hosting.mjs');\n");
fs.writeFileSync(output+'/index.html','<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heroes Goonk</title><script type="module" src="./crossover-hosting.mjs"></script></head><body><p id="hosting-status">Chargement de Heroes Goonk…</p><button id="hosting-retry" hidden>Réessayer</button></body></html>');
fs.copyFileSync(output+'/index.html',output+'/launch.html');
fs.writeFileSync(output+'/robots.txt','User-agent: *\nDisallow: /\n');
fs.writeFileSync(output+'/netlify.toml','[build]\n  publish = "."\n');
console.log('Separate publish directory: '+output);

// Packaging changes the entry HTML and adds crossover files: refresh cache integrity.
const previous=JSON.parse(fs.readFileSync(output+'/coi-serviceworker.js','utf8').match(/^const release = (.+);$/m)[1]);
const files=new Set(Object.keys(previous.files).filter(file=>!file.endsWith('.symbols')));
for(const entry of fs.readdirSync(output,{recursive:true,withFileTypes:true})){
 if(!entry.isFile())continue;
 const file=path.relative(output,path.join(entry.parentPath,entry.name)).split(path.sep).join('/');
 if(!file.startsWith('assets/')&&!file.startsWith('starcraft/data/')&&/\.(js|mjs|css|html|wasm|scx)$/.test(file)&&file!=='coi-serviceworker.js')files.add(file);
}
const hashes=Object.fromEntries([...files].sort().map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(output,decodeURIComponent(file)))).digest('base64')]));
const worker=fs.readFileSync(path.join(root,'web/coi-serviceworker.js'),'utf8');
const id=crypto.createHash('sha256').update(worker).update(JSON.stringify(hashes)).digest('hex').slice(0,24);
fs.writeFileSync(output+'/coi-serviceworker.js',worker.replace('/* OFFLINE_RELEASE */ null',JSON.stringify({id,files:hashes,htmlVersions:{},lazy:true})));

fs.copyFileSync(output+'/coi-serviceworker.js',output+'/crossover-serviceworker.js');

if(process.env.GOONK_PAGES==='1'){
 for(const file of ['vcmiclient.js.symbols','_headers','netlify.toml'])fs.rmSync(path.join(output,file),{force:true});
 fs.writeFileSync(path.join(output,'.nojekyll'),'');
 let bytes=0;const count=dir=>{for(const row of fs.readdirSync(dir,{withFileTypes:true})){const filename=path.join(dir,row.name);if(row.isDirectory())count(filename);else bytes+=fs.statSync(filename).size;}};count(output);
 if(bytes>=1_000_000_000)throw Error(`Pages bundle exceeds 1 GB: ${bytes}`);
 console.log(`GitHub Pages bundle: ${bytes} bytes`);
}
