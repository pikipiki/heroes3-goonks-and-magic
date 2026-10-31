import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {visitBaseGame} from './base-game.mjs';
import {makeManifest} from './assets.mjs';import {renderPage} from './page.mjs';
const root=path.resolve(process.env.GOONK_ENGINE_DIR||'work/vcmi-wasm/emscripten/html5'),data=path.resolve('work/game-data/homm3eng/home/web_user/.local/share/vcmi'),dist=path.resolve('dist');
if(!fs.existsSync(root))throw Error('Extraire le moteur précompilé dans work/vcmi-wasm/emscripten/ avant de construire le site.');
fs.rmSync(dist,{recursive:true,force:true});fs.cpSync(root,dist,{recursive:true});fs.cpSync('web',path.join(dist,'web'),{recursive:true});
// Public builds include the Goonk/WoG mods and showcase map.
const publicData=path.resolve('work/public-data');fs.rmSync(publicData,{recursive:true,force:true});fs.mkdirSync(publicData+'/Maps',{recursive:true});fs.cpSync('mod',publicData+'/Mods',{recursive:true});fs.copyFileSync('maps/000-Goonk.vmap',publicData+'/Maps/000-Goonk.vmap');
const manifest=makeManifest(publicData,{includeBase:false});
for(const file of manifest.files)file.url='.'+file.url;
for(const file of manifest.files){const target=path.join(dist,decodeURIComponent(file.url));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(publicData,file.path),target);}
if(fs.existsSync('game-data/manifest.json')){
 const base=visitBaseGame('game-data',(_file,chunk,bytes)=>{const target=path.join(dist,'assets/base',chunk.hash+'.bin');if(!fs.existsSync(target)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}});
 manifest.files.unshift(...base.files.map(file=>({...file,chunks:file.chunks.map(chunk=>({...chunk,url:'./assets/base/'+chunk.hash+'.bin'}))})));
 manifest.requiresImport=false;manifest.bundledBase=true;
}
let html=renderPage(root);const runtimeNames={};
for(const name of ['vcmiclient.data.js','vcmiclient.wasm','vcmiclient.data','vcmiclient.js']){const bytes=fs.readFileSync(path.join(dist,name)),hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16),hashed=name.replace(/(\.[^.]+)$/,'.'+hash+'$1');fs.renameSync(path.join(dist,name),path.join(dist,hashed));runtimeNames[name]=hashed;}
html=html.replace(/vcmiclient\.(?:data\.js|wasm|data|js)/g,name=>runtimeNames[name]);
fs.writeFileSync(path.join(dist,'game.html'),html);fs.writeFileSync(path.join(dist,'asset-manifest.json'),JSON.stringify(manifest));
fs.writeFileSync(path.join(dist,'_headers'),'/*\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/asset-manifest.json\n  Cache-Control: no-cache\n');
console.log('Site statique créé dans dist — données Heroes III et mods hébergés.');

fs.copyFileSync('web/hosting-index.html',path.join(dist,'index.html'));
fs.copyFileSync('web/hosting-bootstrap.mjs',path.join(dist,'hosting-bootstrap.mjs'));
fs.copyFileSync('web/coi-serviceworker.js',path.join(dist,'coi-serviceworker.js'));
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
