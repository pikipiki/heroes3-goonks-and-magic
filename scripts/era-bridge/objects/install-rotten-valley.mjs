/** Install source bank49 without dropping its next-battle morale penalty. */
import fs from 'node:fs';
import path from 'node:path';
import {prepareTumReviewedObjectBatch} from './review-bank-batch.mjs';
const root='mod/tum-era';
const result=prepareTumReviewedObjectBatch({projectRoot:process.cwd(),sourceRoot:path.resolve(process.argv[2]||'../Third-Upgrade-Mod-Full'),bankIds:[49],legacySubtypes:[],nativeOriginalGuardSlots:true,extraRewardsMode:'era-original',h3BitmapPath:path.resolve('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod')});
if(result.diagnostics.length||result.compiled.length!==1)throw Error(JSON.stringify(result.diagnostics));
for(const [name,bytes] of result.files){
 if(name==='mod.json')continue;
 if(!name.startsWith('content/'))throw Error('Unexpected import path');
 const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);
}
const manifest=JSON.parse(fs.readFileSync(root+'/mod.json'));
manifest.objects=[...new Set([...manifest.objects,'config/objects/bank49.json'])];
Object.assign(manifest.settings.combat.layouts,result.modPatch.settings?.combat?.layouts||{});
fs.writeFileSync(root+'/mod.json',JSON.stringify(manifest,null,2)+'\n');
fs.mkdirSync('outputs/wog-adventure-maps',{recursive:true});
fs.writeFileSync('outputs/wog-adventure-maps/bank49-source.json',JSON.stringify({source:result.source,compiled:result.compiled,assets:result.assets,nativeValidationRequired:true},null,2)+'\n');
console.log('Prepared source Rotten Dragons Valley, including all rewards and morale -3 for next battle.');
