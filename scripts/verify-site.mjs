import {inlineScriptHashes} from './script-policy.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/game.html','utf8');
for(const name of ['storage.html','web/game-storage.mjs','web/storage-page.mjs','web/storage.css','index.html','hosting-bootstrap.mjs','coi-serviceworker.js','.nojekyll'])assert(fs.existsSync('dist/'+name),name);
for(const match of html.matchAll(/(?:src="|from '\.\/|window\.VCMI_(?:WASM|DATA)_URL = ')([^"' ]+)/g)){const url=match[1];if(!url.startsWith('http'))assert(fs.existsSync('dist/'+url.replace(/^\//,'')),`Fichier public absent : ${url}`);}
const manifest=JSON.parse(fs.readFileSync('dist/asset-manifest.json'));assert(!manifest.requiresImport);assert(manifest.files.some(f=>f.path==='Data/H3bitmap.lod'));assert(manifest.files.some(f=>f.path==='Data/H3sprite.lod'));assert(manifest.files.some(f=>f.path==='Data/Heroes3.snd'));assert(manifest.files.some(f=>f.path==='Mods/wake-of-gods/mod.json'));assert(manifest.files.some(f=>f.path==='Maps/000-Goonk.vmap'));console.log('Site vérifié : moteur, données originales Heroes III, mods et cartes hébergés.');
const worker=html.match(/mainScriptUrlOrBlob: new URL\('\.\/([^']+)'/);assert(worker,'Le chemin des workers Emscripten doit suivre le nom versionné du moteur.');assert(fs.existsSync('dist/'+worker[1]));

assert(!/(?:src|href)="\/(?!\/)|(?:WASM|DATA)_URL = '\//.test(html),'Les liens du jeu doivent être relatifs pour GitHub Pages.');
assert(manifest.files.every(f=>f.url?.startsWith('./assets/')||f.chunks.every(c=>c.url?.startsWith('./assets/'))));
for(const file of manifest.files)for(const chunk of file.chunks||[])if(chunk.url)assert(fs.existsSync('dist/'+chunk.url));
for(const match of html.matchAll(/\bimport\(['"](\.\/[^'"]+)['"]\)/g))assert(fs.existsSync('dist/'+match[1]),'Module dynamique absent : '+match[1]);

for(const name of ['index.html','game.html','storage.html']){const doc=fs.readFileSync('dist/'+name,'utf8'),policy=doc.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];assert(policy,'Politique de scripts manquante');assert(!policy.includes("'unsafe-inline'"));for(const hash of inlineScriptHashes(doc))assert(policy.includes(hash),'Script de démarrage non autorisé');}
