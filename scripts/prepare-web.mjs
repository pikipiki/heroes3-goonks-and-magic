import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const destination='work/vcmi-wasm/emscripten';fs.mkdirSync(destination,{recursive:true});
if(!fs.existsSync(destination+'/html5/vcmiclient.wasm'))execFileSync('tar',['-xzf','outputs/vcmi-wasm-goonk-0.3.1-engine.tar.gz','-C',destination]);
const data='work/game-data/homm3eng/home/web_user/.local/share/vcmi';fs.mkdirSync(data+'/Mods',{recursive:true});fs.mkdirSync(data+'/Maps',{recursive:true});
fs.cpSync('mod/goonk',data+'/Mods/goonk',{recursive:true});fs.copyFileSync('maps/000-Goonk.vmap',data+'/Maps/000-Goonk.vmap');
if(fs.existsSync('mod/wake-of-gods'))fs.cpSync('mod/wake-of-gods',data+'/Mods/wake-of-gods',{recursive:true});
