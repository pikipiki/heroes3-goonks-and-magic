/** Produce an unregistered policy candidate only after validating the source contract. */
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const [projectArg,tumArg,outArg,...flags]=process.argv.slice(2);
for(const flag of flags)if(!['--inactive','--chasm'].includes(flag))throw Error('Unknown flag '+flag);
const inactive=flags.includes('--inactive'),chasm=flags.includes('--chasm');
if(!projectArg||!tumArg||!outArg)throw Error('Usage: node build-status-policy.mjs PROJECT TUM OUTPUT');
const project=path.resolve(projectArg),tum=path.resolve(tumArg),out=path.resolve(outArg);
if(out===project||out.startsWith(project+path.sep))throw Error('Output must be outside the project');
const {createProductionObjectResolvers}=await import(pathToFileURL(project+'/scripts/era-bridge/objects/production-resolvers.mjs'));
const {readEraArchive}=await import(pathToFileURL(project+'/scripts/era-bridge/resources.mjs'));
const {parseCreatureExperience}=await import(pathToFileURL(project+'/scripts/era-bridge/creatures/crexpbon.mjs'));
const rows=parseCreatureExperience(readEraArchive(fs.readFileSync(tum+'/Data/AmeCre.pac')).extract('crexpbon.txt').toString('latin1'));
for(const code of ['c','k']){
 const match=rows.filter(r=>r.creature===254&&r.code===code);
 if(match.length!==1||match[0].modifier!=='#71'||JSON.stringify(match[0].values)!=='[0,5,10,15,20,25,30,35,40,45,50]')throw Error('Unreviewed254 '+code+' contract');
}
const cfg=fs.readFileSync(tum+'/Data/Creatures/254.cfg','utf8');
if(!/^Spell effect=4\s*$/m.test(cfg))throw Error('Unreviewed254 innate selector');
const resolver=createProductionObjectResolvers({projectRoot:project,sourceRoot:tum});
const byEra=new Map(resolver.byEra),actors=[];
if(!inactive){byEra.set(254,'tum-era:necrossDragon');actors.push('tum-era:necrossDragon');}
if(chasm){
 const match=rows.filter(r=>r.creature===231&&r.code==='c');
 if(match.length!==1||match[0].modifier!=='#78'||JSON.stringify(match[0].values)!=='[0,5,10,15,20,25,30,35,40,45,50]')throw Error('Unreviewed231 c78 contract');
 if(!inactive){byEra.set(231,'tum-era:chasmDragon');actors.push('tum-era:chasmDragon');}
}
const sourceIds={};for(const[id,key]of [...byEra].sort((a,b)=>a[0]-b[0])){
 if(key in sourceIds)throw Error('Ambiguous source identity '+key);sourceIds[key]=id;
}
const policy={schemaVersion:1,creatures:actors,sourceIds};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'era-bridge-status-attacks.json'),JSON.stringify(policy,null,2)+'\n');
console.log(JSON.stringify({out,sourceIds:Object.keys(sourceIds).length,actors,registered:false,requiresNativeValidation:true}));
