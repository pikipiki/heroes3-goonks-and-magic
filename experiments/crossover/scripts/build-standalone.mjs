// Separate Netlify publish directory, built from the verified Heroes bundle and crossover.
import fs from 'node:fs';
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
fs.copyFileSync(output+'/index.html',output+'/laboratoire.html');
let heroesPage=fs.readFileSync(output+'/game.html','utf8');
heroesPage=heroesPage.replace('</body>','<script type="module" src="./adventure-entry.js"></script></body>');
fs.writeFileSync(output+'/game.html',heroesPage);
fs.writeFileSync(output+'/heroes-entry.js',"location.replace(new URL('./game.html?mobile=1&skip-autoresume=1',location.href));\n");
fs.writeFileSync(output+'/index.html','<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Heroes Goonk</title><script type="module" src="./heroes-entry.js"></script></head><body>Chargement de Heroes Goonk…</body></html>');
fs.writeFileSync(output+'/robots.txt','User-agent: *\nDisallow: /\n');
fs.writeFileSync(output+'/netlify.toml','[build]\n  publish = "."\n');
console.log('Separate publish directory: '+output);
