/** Review overlay only; requires a native engine with ERA_FIXED_POWER_OPENING_SPELL. */
import fs from 'node:fs';import path from 'node:path';
import {readEraArchive} from '../resources.mjs';
import {readArtifactTraits,parseJsonc,identifiersByIndex,importNativeArtifacts} from './importer.mjs';
const args=process.argv.slice(2);if(args.length!==3)throw Error('Usage: import-fixed-opening-shields.mjs PROJECT TUM REVIEW_OUTPUT');
const [project,tum,out]=args.map(p=>path.resolve(p));if(out===project||out.startsWith(project+path.sep))throw Error('Use an isolated review output');
const archive=readEraArchive(fs.readFileSync(path.join(tum,'Data/EmeraldArtifacts.pac'))),cfgs={};
for(const[id,spell]of[[210,24],[254,25]]){
 const text=fs.readFileSync(path.join(tum,'Data/artifacts',id+'.cfg'),'utf8');
 if(text.replace(/\r/g,'').trim()!=='Defence=6\nAutospell='+spell+'\nImmunities='+spell)throw Error('Changed source shield'+id+' requires a fresh audit');cfgs[id]=text;
}
const spells=identifiersByIndex(fs.readdirSync(path.join(project,'work/vcmi-wasm/config/spells')).filter(p=>p.endsWith('.json')).map(p=>parseJsonc(fs.readFileSync(path.join(project,'work/vcmi-wasm/config/spells',p),'utf8'))));
if(spells.get(24)!=='deathRipple'||spells.get(25)!=='destroyUndead')throw Error('Changed native global spell identities');
const result=importNativeArtifacts({traits:readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language:JSON.parse(fs.readFileSync(path.join(tum,'Lang/TUM_Artifacts.json'),'utf8')).era.artifacts,cfgs,archive,resolveSpell:id=>spells.has(id)?'core:'+spells.get(id):null,fixedPowerOpeningSpellContract:'source-fixed50-global-v1'});
if(result.report.length!==2||result.report.some(r=>!r.included))throw Error(JSON.stringify(result.report));
for(const[name,bytes]of result.files){const file=path.join(out,name.replace(/^Content\//,'content/'));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
const write=(name,data)=>{const file=path.join(out,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');};
write('content/config/fixed-opening-shields.candidate.json',result.definitions);
write('source-import-report.json',{registered:false,activationReady:false,contract:'source-fixed50-global-v1',sourceArchiveSha256:archive.sha256,source:'Emerald3/emerald/emerald.cpp CastArtifactSpell; original5A041B preserves caller power in mode2',report:result.report,pending:['Native opening damage280/550 at distinct hero powers','Owner-army immunity, target biological classes and no mana use','Source opening order and battle-wide cast restrictions']});
console.log(JSON.stringify({out,artifacts:2,files:result.files.size,activationReady:false}));
