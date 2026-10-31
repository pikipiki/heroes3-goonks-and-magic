import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/game.html','utf8');
for(const name of ['index.html','hosting-bootstrap.mjs','coi-serviceworker.js','.nojekyll'])assert(fs.existsSync('dist/'+name),name);
for(const match of html.matchAll(/(?:src="|from '\.\/|window\.VCMI_(?:WASM|DATA)_URL = ')([^"' ]+)/g)){const url=match[1];if(!url.startsWith('http'))assert(fs.existsSync('dist/'+url.replace(/^\//,'')),`Fichier public absent : ${url}`);}
const manifest=JSON.parse(fs.readFileSync('dist/asset-manifest.json'));assert(manifest.requiresImport);assert(manifest.files.every(f=>f.path.startsWith('Mods/')||f.path==='Maps/000-Goonk.vmap'));assert(manifest.files.some(f=>f.path==='Mods/wake-of-gods/mod.json'));console.log('Site vérifié : moteur, mods et carte Goonk ; données originales exclues.');
const worker=html.match(/mainScriptUrlOrBlob: new URL\('\.\/([^']+)'/);assert(worker,'Le chemin des workers Emscripten doit suivre le nom versionné du moteur.');assert(fs.existsSync('dist/'+worker[1]));

assert(!/(?:src|href)="\/(?!\/)|(?:WASM|DATA)_URL = '\//.test(html),'Les liens du jeu doivent être relatifs pour GitHub Pages.');
assert(manifest.files.every(f=>f.url.startsWith('./assets/')));
for(const match of html.matchAll(/\bimport\(['"](\.\/[^'"]+)['"]\)/g))assert(fs.existsSync('dist/'+match[1]),'Module dynamique absent : '+match[1]);
