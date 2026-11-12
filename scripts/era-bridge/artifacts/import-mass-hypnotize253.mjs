/** Review overlay only; requires a native engine with ERA_FIXED_POWER_OPENING_SPELL. */
import fs from 'node:fs';import path from 'node:path';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,parseJsonc,identifiersByIndex,importNativeArtifacts} from './importer.mjs';
const args=process.argv.slice(2);if(args.length!==3)throw Error('Usage: import-mass-hypnotize253.mjs PROJECT TUM REVIEW_OUTPUT');
const [project,tum,out]=args.map(p=>path.resolve(p));if(out===project||out.startsWith(project+path.sep))throw Error('Use an isolated review output');
const archive=readEraArchive(fs.readFileSync(path.join(tum,'Data/EmeraldArtifacts.pac'))),cfgs={};
for(const[id,spell]of[[253,60]]){
 const text=fs.readFileSync(path.join(tum,'Data/artifacts',id+'.cfg'),'utf8');
 if(text.replace(/\r/g,'').trim()!=='Autospell='+spell)throw Error('Changed source mine'+id+' requires a fresh audit');cfgs[id]=text;
}
const spells=identifiersByIndex(fs.readdirSync(path.join(project,'work/vcmi-wasm/config/spells')).filter(p=>p.endsWith('.json')).map(p=>parseJsonc(fs.readFileSync(path.join(project,'work/vcmi-wasm/config/spells',p),'utf8'))));
if(spells.get(60)!=='hypnotize')throw Error('Changed native Hypnotize identity');
const result=importNativeArtifacts({traits:readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language:JSON.parse(fs.readFileSync(path.join(tum,'Lang/TUM_Artifacts.json'),'utf8')).era.artifacts,cfgs,archive,resolveSpell:id=>spells.has(id)?'core:'+spells.get(id):null,fixedPowerOpeningSpellContract:'source-mass-hypnotize253-v1'});
if(result.report.length!==1||result.report.some(r=>!r.included))throw Error(JSON.stringify(result.report));
for(const[name,bytes]of result.files){const file=path.join(out,name.replace(/^Content\//,'content/'));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
const write=(name,data)=>{const file=path.join(out,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');};
write('content/config/mass-hypnotize253.candidate.json',result.definitions);
write('runtime.candidate.json',{schemaVersion:1,artifact:'tum-era:artifact253'});
write('source-import-report.json',{registered:false,activationReady:false,contract:'source-mass-hypnotize253-v1',sourceArchiveSha256:archive.sha256,source:'Emerald CastArtifactSpell; source5A13BB→5A69E0; threshold5A8673→5A86CC, see mass-hypnotize253-source.json',report:result.report,pending:['Native HP boundaries with actual mastery and cached power','Both original sides; immunity/context/RNG/already-hypnotized guards','Explicit duration50 and backpack/no mana/equipment order controls']});
console.log(JSON.stringify({out,artifacts:1,files:result.files.size,activationReady:false}));
