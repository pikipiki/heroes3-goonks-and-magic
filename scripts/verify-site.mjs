import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/index.html','utf8');
for(const match of html.matchAll(/(?:src="|from '\.\/|window\.VCMI_(?:WASM|DATA)_URL = ')([^"' ]+)/g)){const url=match[1];if(!url.startsWith('http'))assert(fs.existsSync('dist/'+url.replace(/^\//,'')),`Fichier public absent : ${url}`);}
const manifest=JSON.parse(fs.readFileSync('dist/asset-manifest.json'));assert(manifest.requiresImport);assert(manifest.files.every(f=>f.path.startsWith('Mods/')||f.path==='Maps/000-Goonk.vmap'));assert(manifest.files.some(f=>f.path==='Mods/wake-of-gods/mod.json'));console.log('Site vérifié : moteur, mods et carte Goonk ; données originales exclues.');
const worker=html.match(/mainScriptUrlOrBlob: new URL\('\.\/([^']+)'/);assert(worker,'Le chemin des workers Emscripten doit suivre le nom versionné du moteur.');assert(fs.existsSync('dist/'+worker[1]));
