/** Source269..271 cached battle power; inactive phase6 candidate. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
import{readEraArchive}from'../resources.mjs';
import{readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon}from'./importer.mjs';
import{compileArtifactDefinition}from'./artifacts.mjs';
import{validateInterferencePolicy}from'./interference-runtime.mjs';
const[project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('PROJECT SOURCE FRESH_OUTPUT required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Changed original script');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Changed original artifact archive');
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const write=(name,data)=>{const p=path.join(output,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');},definitions={};
for(const id of[269,270,271]){
 if(fs.existsSync(path.join(source,'Data/artifacts',id+'.cfg')))throw Error('Additional Interference CFG requires review');
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity changed');
 const compiled=compileArtifactDefinition({id,text:'',authorizeAdapters:['interference10','interference25'],baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!compiled.ok)throw Error(JSON.stringify(compiled.diagnostics));definitions['artifact'+id]=compiled.definition;
 for(const suffix of['def','msk'])write('content/Sprites/'+asset+'/map.'+suffix,archive.extract('ava'+String(id).padStart(4,'0')+'.'+suffix));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/interference.candidate.json',definitions);
write('runtime.candidate.json',validateInterferencePolicy({schemaVersion:1,artifacts:{'tum-era:artifact269':{interference:{percent:10}},'tum-era:artifact270':{interference:{percent:10}},'tum-era:artifact271':{interference:{percent:25}}}}));
write('source-review.json',{ids:[269,270,271],scriptSHA256:sha(script),archiveSHA256:archive.sha256,sourceLines:[1992,2040],mechanism:'Only with two original heroes, inspect each of19 equipped body slots. Unique269/270 reduce opposing cached battle spell power by10% each,271 by25%. Add percentages, truncate integer product/100, clamp minimum1. Hero map primaries do not change. Both directions are independent.',cache:{source:'CombatManager21460+4*side',native:'ONE_BATTLE ERA_SOURCE_ARTIFACT_STATE on battle node, [1,carrierSourceId,affectedSide,effectivePower,originalPower]',fixedExplicitCasts:'Explicit fixed50 powers/durations remain50; artifact opening summon counts still read original map hero power.',secondaryMassEffects:'262/263 derive their30% power from this effective cached battle power.',lightningRod:'220 raw extra bolt uses Mechanics effective power; no extra modifier of its own.'},pending:['Native single/combined/bilateral/duplicate/backpack/two-hero gates','Ordinary numeric damage and durations, preserved map stats and save/load','Fixed50 opening and source262/263/220 integration controls','Battle hero power display matching original(originalEffective) UX'],activationReady:false});
console.log('Prepared source269..271 candidate; production unchanged.');
