/** Complete original banks34/35; all eight native source-wave controls gate installation. */
import fs from 'node:fs';import path from 'node:path';import {prepareTumReviewedObjectBatch} from './review-bank-batch.mjs';
const evidence=process.argv[2]||'outputs/wog-priorities-0.4.147/native-mithril-banks.json',proof=JSON.parse(fs.readFileSync(evidence));
if(proof.passed!==true||[34,35].some(id=>[0,1,2,3].some(state=>proof.report?.[id+'-'+state]?.passed!==true)))throw Error('All eight original native waves must pass before installation');
const root='mod/tum-era',result=prepareTumReviewedObjectBatch({projectRoot:process.cwd(),sourceRoot:path.resolve(process.argv[3]||'../Third-Upgrade-Mod-Full'),bankIds:[34,35],legacySubtypes:[],nativeOriginalGuardSlots:true,extraRewardsMode:'era-original',h3BitmapPath:path.resolve('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod')});
if(result.diagnostics.length||result.compiled.length!==2)throw Error(JSON.stringify(result.diagnostics));
for(const[name,bytes]of result.files){if(name==='mod.json')continue;if(!name.startsWith('content/'))throw Error('Unexpected path');const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
const manifest=JSON.parse(fs.readFileSync(root+'/mod.json'));manifest.objects=[...new Set([...manifest.objects,'config/objects/bank34.json','config/objects/bank35.json'])];Object.assign(manifest.settings.combat.layouts,result.modPatch.settings?.combat?.layouts||{});fs.writeFileSync(root+'/mod.json',JSON.stringify(manifest,null,2)+'\n');
fs.mkdirSync('outputs/wog-adventure-maps',{recursive:true});fs.writeFileSync('outputs/wog-adventure-maps/mithril-banks-source.json',JSON.stringify({source:result.source,compiled:result.compiled,assets:result.assets,nativeValidation:evidence},null,2)+'\n');
console.log('Installed complete original Mithril Tower and Experimental Factory after eight native wave controls.');
