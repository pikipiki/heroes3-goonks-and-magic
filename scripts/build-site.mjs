import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {makeManifest} from './assets.mjs';import {renderPage} from './page.mjs';
const root=path.resolve('work/vcmi-wasm/emscripten/html5'),data=path.resolve('work/game-data/homm3eng/home/web_user/.local/share/vcmi'),dist=path.resolve('dist');
if(!fs.existsSync(root))throw Error('Extraire le moteur précompilé dans work/vcmi-wasm/emscripten/ avant de construire le site.');
fs.rmSync(dist,{recursive:true,force:true});fs.cpSync(root,dist,{recursive:true});fs.cpSync('web',path.join(dist,'web'),{recursive:true});
// Public builds include the Goonk/WoG mods and showcase map, never the original Heroes III files.
const manifest=makeManifest(data,{includeBase:false});
for(const file of manifest.files){const target=path.join(dist,decodeURIComponent(file.url));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(data,file.path),target);}
let html=renderPage(root);
for(const name of ['vcmiclient.wasm','vcmiclient.data','vcmiclient.js','vcmiclient.data.js']){const bytes=fs.readFileSync(path.join(dist,name)),hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16),hashed=name.replace(/(\.[^.]+)$/,'.'+hash+'$1');fs.renameSync(path.join(dist,name),path.join(dist,hashed));html=html.replaceAll(name,hashed);}
fs.writeFileSync(path.join(dist,'index.html'),html);fs.writeFileSync(path.join(dist,'asset-manifest.json'),JSON.stringify(manifest));
fs.writeFileSync(path.join(dist,'_headers'),'/*\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/asset-manifest.json\n  Cache-Control: no-cache\n');
console.log('Site statique créé dans dist — import local des données Heroes III au premier lancement.');
