/** Stage every source Seminarium state atomically; activation follows native validation. */
import fs from 'node:fs';import path from 'node:path';
import {prepareTumReviewedObjectBatch} from './review-bank-batch.mjs';
const output=path.resolve(process.argv[2]||'/tmp/goonk-seminarium-stage');
const result=prepareTumReviewedObjectBatch({projectRoot:process.cwd(),sourceRoot:path.resolve(process.argv[3]||'../Third-Upgrade-Mod-Full'),bankIds:[45],legacySubtypes:[],nativeOriginalGuardSlots:true,extraRewardsMode:'era-original',h3BitmapPath:path.resolve('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod')});
if(result.diagnostics.length||result.compiled.length!==1)throw Error(JSON.stringify(result.diagnostics));
for(const[name,bytes]of result.files){const file=path.join(output,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
fs.writeFileSync(path.join(output,'source-review.json'),JSON.stringify({source:result.source,compiled:result.compiled,assets:result.assets,modPatch:result.modPatch,nativeValidationRequired:true},null,2)+'\n');
console.log(JSON.stringify({output,files:result.files.size,compiled:result.compiled.length,activation:false}));
