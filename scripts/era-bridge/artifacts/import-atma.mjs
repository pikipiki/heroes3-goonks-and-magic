/** Original264/265 assets + stored equalization contracts; inactive phase5 review. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
import{readEraArchive}from'../resources.mjs';
import{readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon}from'./importer.mjs';
import{compileArtifactDefinition}from'./artifacts.mjs';
import{validateStatefulArtifactPolicy}from'./stateful-runtime.mjs';
const[project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('PROJECT SOURCE FRESH_OUTPUT required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Changed original script');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Changed original artifact archive');
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const write=(name,data)=>{const p=path.join(output,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');},definitions={};
for(const id of[264,265]){
 if(fs.existsSync(path.join(source,'Data/artifacts',id+'.cfg')))throw Error('Additional Atma CFG requires review');
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity changed');
 const compiled=compileArtifactDefinition({id,text:'',authorizeAdapters:['equalAttackDefense','equalPowerKnowledge'],baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!compiled.ok)throw Error(JSON.stringify(compiled.diagnostics));definitions['artifact'+id]=compiled.definition;
 for(const suffix of['def','msk'])write('content/Sprites/'+asset+'/map.'+suffix,archive.extract('ava'+String(id).padStart(4,'0')+'.'+suffix));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/atma.candidate.json',definitions);
write('runtime.candidate.json',validateStatefulArtifactPolicy({schemaVersion:1,artifacts:{'tum-era:artifact264':{storedEqualization:{}},'tum-era:artifact265':{storedEqualization:{}}}}));
write('source-review.json',{ids:[264,265],scriptSHA256:sha(script),archiveSHA256:archive.sha256,sourceLines:[1692,1759],mechanism:'On equipped source item event, read total primary skills and increase the lower member by their difference. Store that exact adjustment per hero. On unequip remove only the stored adjustment, preserving later changes. CM2 refreshes265 then264.',documentation:[{url:'https://www.h3wog.com/erm_help/receivers/receiver_he_right.htm',contract:'HE:F reads primary skills including artifact bonuses; HE:F/.../1 would read base skills and is not used.'},{url:'https://www.h3wog.com/erm_help/other/trigger_right.htm',contract:'AE does not fire for backpack. Legacy occupied-slot attempts can trigger temporary unequip/re-equip; CM2 is right mouse in hero information.'}],state:{bonus:'ERA_SOURCE_ARTIFACT_STATE',parameters:['version=1','sourceArtifactId','deltaAttack','deltaDefense','deltaPower','deltaKnowledge'],duration:'PERMANENT',initialMissingState:'Zero source SN:W value; initially worn map inventory is not retroactively changed by UI reads.'},documentedAdaptations:[{source:'The supplied script has no explicit initial-map264/265 trigger. ERA missing associative integers are zero; whether initial Win32 inventory assembly fires AE1 has not been established.',native:'Initially worn map items remain unchanged until a real equipment event or explicit Rebalance. This deterministic initialization behavior is an explicit adaptation, not a claim of a proven original startup cycle.'},{source:'Legacy Win32 transient AE0/AE1 calls while trying occupied equipment slots.',native:'Atomic inventory transitions use final equipment identities. Re-equilibration is an explicit tactile action equivalent to CM2; no implicit refresh at window opening.'},{source:'Right mouse anywhere in hero screen refreshes equipped265 then264.',native:'Explicit Rééquilibrer action, server-owned current-turn hero, no combat or held artifact, same265 then264 order.'}],pending:['Matching native WebAssembly compilation','Native equip/backpack/removal/transfer controls','Native persistent save/reload and later primary-skill gains','Mobile/iPad action layout and DOM stability'],activationReady:false});
console.log('Prepared source264/265 review; no active mod data changed.');
