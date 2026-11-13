/** Source259 initialized-stack all-adjacent flag; inactive candidate. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
import{readEraArchive}from'../resources.mjs';
import{readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon}from'./importer.mjs';
import{compileArtifactDefinition}from'./artifacts.mjs';
import{validateHydraQueen259}from'./hydra-queen259.mjs';
const[project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('PROJECT SOURCE FRESH_OUTPUT required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Changed original script');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Changed original artifact archive');
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const write=(name,data)=>{const p=path.join(output,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');},definitions={};
for(const id of[259]){
 if(fs.existsSync(path.join(source,'Data/artifacts',id+'.cfg')))throw Error('Additional source259 CFG requires review');
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity changed');
 const compiled=compileArtifactDefinition({id,text:'',authorizeAdapters:['hydraQueen'],resolveArtifact:id=>[175,176,177,178].includes(id)?'tum-era:artifact'+id:undefined,baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!compiled.ok)throw Error(JSON.stringify(compiled.diagnostics));compiled.definition.text.description="{Helm of the Hydra Queen}\n\nOne-hex troops without a breath attack strike every adjacent enemy. The original vampire, ghost, red-skeleton and life-draining dragon types are excluded.";definitions['artifact'+id]=compiled.definition;
 for(const suffix of['def','msk'])write('content/Sprites/'+asset+'/map.'+suffix,archive.extract('ava'+String(id).padStart(4,'0')+'.'+suffix));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/hydra-queen259.candidate.json',definitions);
write('runtime.candidate.json',validateHydraQueen259({schemaVersion:1,artifact:'tum-era:artifact259'}));
write('source-review.json',{ids:[259],scriptSHA256:sha(script),archiveSHA256:archive.sha256,sourceLines:[1370,1397],mechanism:'After source stack initialization43D5C7: original-side hero259 equipped; except149 towers, double-wide flag, breath flag and exact WOG44 life-drain type whitelist, set monster flag19 ATTACKS_ALL_AROUND. No separate NO_RETALIATION bit is assigned by the actual script.',excludedTypes:[63,154,159,221,224,296,325],sourceIdentityRegistry:'era-bridge-status-attacks.sourceIds, canonical native-key to original-ID mapping; future ported source296/325 are excluded as soon as their canonical binding exists.',nativeState:'CStack::localInit after army/creature bonuses attach and before UnitState caches: ONE_BATTLE ATTACKS_ALL_ADJACENT sourced to259; same source-selector dedup on save/load; original side hero is used for new summoned/cloned stacks.',components:[175,176,177,178],pending:['Native adjacent primary/secondary damage and original retaliation','Backpack, opposite hero, unrelated artifact and double-wide/breath/tower/type whitelist guards','New summons/clones and saved battle initialization'],activationReady:false});
console.log('Prepared source259 initialized-stack candidate without activation.');
