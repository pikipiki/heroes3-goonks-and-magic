import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {unpackBaseGame} from './base-game.mjs';
const destination='work/vcmi-wasm/emscripten';fs.mkdirSync(destination,{recursive:true});
const archive='outputs/vcmi-wasm-goonk-0.4.53-engine.tar.gz',marker=destination+'/.archive-sha256';
const fingerprint=crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
if(!fs.existsSync(destination+'/html5/vcmiclient.wasm')||!fs.existsSync(marker)||fs.readFileSync(marker,'utf8')!==fingerprint){execFileSync('tar',['-xzf',archive,'-C',destination]);fs.writeFileSync(marker,fingerprint);}
const data='work/game-data/homm3eng/home/web_user/.local/share/vcmi';
fs.mkdirSync(data+'/Mods',{recursive:true});fs.mkdirSync(data+'/Maps',{recursive:true});
if(fs.existsSync('game-data/manifest.json'))unpackBaseGame('game-data',data);
for(const name of fs.readdirSync('mod'))if(fs.statSync('mod/'+name).isDirectory())fs.cpSync('mod/'+name,data+'/Mods/'+name,{recursive:true});for(const file of fs.readdirSync('maps').filter(f=>f.endsWith('.vmap')))fs.copyFileSync('maps/'+file,data+'/Maps/'+file);
