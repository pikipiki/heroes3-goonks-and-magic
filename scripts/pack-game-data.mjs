import {packBaseGame} from './base-game.mjs';
const manifest=packBaseGame('work/game-data/homm3eng/home/web_user/.local/share/vcmi','game-data');
console.log(manifest.files.length+' fichiers intégrés, '+Math.round(manifest.files.reduce((n,f)=>n+f.size,0)/1048576)+' Mo, morceaux de 4 Mo maximum.');
