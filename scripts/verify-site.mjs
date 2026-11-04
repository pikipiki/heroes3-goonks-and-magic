import {exportedI32Constant} from './wasm-constant.mjs';
import {inlineScriptHashes} from './script-policy.mjs';
import crypto from 'node:crypto';
import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/game.html','utf8');
for(const name of ['storage.html','web/game-storage.mjs','web/storage-page.mjs','web/storage.css','index.html','hosting-bootstrap.mjs','coi-serviceworker.js','.nojekyll'])assert(fs.existsSync('dist/'+name),name);
for(const match of html.matchAll(/(?:src="|from '\.\/|window\.VCMI_(?:WASM|DATA)_URL = ')([^"' ]+)/g)){const url=match[1];if(!url.startsWith('http'))assert(fs.existsSync('dist/'+url.split('?')[0].replace(/^\//,'')),`Fichier public absent : ${url}`);}
const manifest=JSON.parse(fs.readFileSync('dist/asset-manifest.json'));assert(!manifest.requiresImport);assert(manifest.files.some(f=>f.path==='Data/H3bitmap.lod'));assert(manifest.files.some(f=>f.path==='Data/H3sprite.lod'));assert(manifest.files.some(f=>f.path==='Data/Heroes3.snd'));assert(manifest.files.some(f=>f.path==='Mods/wake-of-gods/mod.json'));assert(manifest.files.some(f=>f.path==='Maps/000-Goonk.vmap'));console.log('Site vérifié : moteur, données originales Heroes III, mods et cartes hébergés.');
assert(manifest.files.some(f=>f.path==='Mods/goonk/Content/Sprites2x/goonk/map-town-v2.png'),'La texture HD du château doit être hébergée.');
for(const name of ['town-v2.png','structure-dwellingLvl1.png','structure-castle.png','outline-castle.png','card-castle.png'])assert(manifest.files.some(f=>f.path==='Mods/goonk/Content/Sprites2x/goonk/'+name),'Bâtiment HD manquant : '+name);
const worker=html.match(/mainScriptUrlOrBlob: new URL\('\.\/([^']+)'/);assert(worker,'Le chemin des workers Emscripten doit suivre le nom versionné du moteur.');assert(fs.existsSync('dist/'+worker[1]));

assert(!/(?:src|href)="\/(?!\/)|(?:WASM|DATA)_URL = '\//.test(html),'Les liens du jeu doivent être relatifs pour GitHub Pages.');
assert(manifest.files.every(f=>f.url?.startsWith('./assets/')||f.chunks.every(c=>c.url?.startsWith('./assets/'))));
for(const file of manifest.files)for(const chunk of file.chunks||[])if(chunk.url)assert(fs.existsSync('dist/'+chunk.url));
for(const match of html.matchAll(/\bimport\(['"](\.\/[^'"]+)['"]\)/g))assert(fs.existsSync('dist/'+match[1].split('?')[0]),'Module dynamique absent : '+match[1]);

for(const name of ['index.html','game.html','storage.html']){const doc=fs.readFileSync('dist/'+name,'utf8'),policy=doc.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];assert(policy,'Politique de scripts manquante');assert(!policy.includes("'unsafe-inline'"));for(const hash of inlineScriptHashes(doc))assert(policy.includes(hash),'Script de démarrage non autorisé');}

for(const name of ['third-upgrades','tum-era'])assert(manifest.files.some(f=>f.path==='Mods/'+name+'/mod.json'),'Mod TUM manquant : '+name);

const eraWasm=fs.readdirSync('dist').find(name=>/^vcmiclient\.[a-f0-9]+\.wasm$/.test(name));assert(eraWasm,'Moteur WebAssembly manquant');const eraModule=await WebAssembly.compile(fs.readFileSync('dist/'+eraWasm));const eraJS=fs.readdirSync('dist').find(name=>/^vcmiclient\.[a-f0-9]+\.js$/.test(name));const eraExport=fs.readFileSync('dist/'+eraJS,'utf8').match(/Module\["_vcmiEraBridgeVersion"\]\s*=\s*wasmExports\["([^"]+)"\]/);assert(eraExport&&WebAssembly.Module.exports(eraModule).some(item=>item.name===eraExport[1]&&item.kind==='function'),'Le moteur doit inclure les services natifs du bridge ERA.');assert(manifest.files.some(f=>f.path==='Mods/tum-era/content/config/era-bridge-runtime.json'),'Politique ERA native manquante');

assert.equal(exportedI32Constant(fs.readFileSync('dist/'+eraWasm),eraExport[1],WebAssembly.Module.imports(eraModule).filter(item=>item.kind==='function').length),2,'La version native du bridge ERA doit être 2.');

const build=JSON.parse(fs.readFileSync('dist/engine-build.json'));assert.equal(build.sha256,crypto.createHash('sha256').update(fs.readFileSync('dist/'+build.wasm)).digest('hex'));assert.deepEqual(build.mobile,{width:800,height:600});
const memoryExport=fs.readFileSync('dist/'+eraJS,'utf8').match(/Module\["_vcmiWebMemoryVersion"\]\s*=\s*wasmExports\["([^"]+)"\]/);assert(memoryExport,'Le moteur doit inclure le chargement à la demande');assert.equal(exportedI32Constant(fs.readFileSync('dist/'+eraWasm),memoryExport[1],WebAssembly.Module.imports(eraModule).filter(item=>item.kind==='function').length),1);
