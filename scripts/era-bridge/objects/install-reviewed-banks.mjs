/** Install only whole source banks with resolved guardians and rewards. */
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {prepareTumReviewedObjectBatch} from './review-bank-batch.mjs';
const project=process.cwd(),sourceRoot=path.resolve(process.argv[2]||'../Third-Upgrade-Mod-Full');
const result=prepareTumReviewedObjectBatch({projectRoot:project,sourceRoot,bankIds:[36,39,40,42,46,54,55,58,60],legacySubtypes:[],h3BitmapPath:path.resolve('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod'),nativeOriginalGuardSlots:true});
if(result.diagnostics.length||result.compiled.length!==9)throw Error(JSON.stringify(result.diagnostics));
const root='mod/tum-era';for(const [name,bytes]of result.files)if(name!=='mod.json'){if(!name.startsWith('content/'))throw Error('Unexpected output '+name);const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
const file=root+'/mod.json',manifest=JSON.parse(fs.readFileSync(file));manifest.objects=[...new Set([...manifest.objects,...result.compiled.map(c=>c.config.replace(/^content\//,''))])];
manifest.settings??={};manifest.settings.combat??={};manifest.settings.combat.layouts??={};for(const[key,value]of Object.entries(result.modPatch.settings?.combat?.layouts||{})){const old=manifest.settings.combat.layouts[key];if(old&&JSON.stringify(old)!==JSON.stringify(value))throw Error('Conflicting existing layout '+key);manifest.settings.combat.layouts[key]=value;}
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
fs.mkdirSync('outputs/wog-priorities-0.4.145',{recursive:true});fs.writeFileSync('outputs/wog-priorities-0.4.145/bank-source.json',JSON.stringify({source:result.source,added:result.compiled,ledger:result.ledger,nativeValidationRequired:true},null,2)+'\n');
const out=process.env.TUM_FIXTURE_STAGE;if(out){fs.mkdirSync(out,{recursive:true});for(const[name,bytes]of result.files){const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}fs.writeFileSync(path.join(out,'import-report.json'),JSON.stringify({...result,files:[...result.files.keys()]},null,2));}
console.log('Prepared nine source-complete banks; native validation is required.');
