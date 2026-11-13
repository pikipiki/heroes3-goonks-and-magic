/** Original260 separate human Expert Pathfinding and AI daily400; inactive candidate. */
import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';
import{readEraArchive}from'../resources.mjs';
import{readArtifactTraits,normalizeArtifactLanguage,decodeArtifactIcon,encodePng,scenarioIcon}from'./importer.mjs';
import{compileArtifactDefinition}from'./artifacts.mjs';
import{validateWayfarer260}from'./wayfarer260.mjs';
const[project,source,output]=process.argv.slice(2).map(p=>path.resolve(p));
if(!output||output.startsWith(project+path.sep)||fs.existsSync(output))throw Error('PROJECT SOURCE FRESH_OUTPUT required');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const script=fs.readFileSync(path.join(source,'Data/s/Third Upgrade Mod.erm'));
if(sha(script)!=='0dbb2a4498de1ab57492fd506ffd5f177abb6455af6037e42d274d0a3ea8a315')throw Error('Changed original script');
const archive=readEraArchive(fs.readFileSync(path.join(source,'Data/EmeraldArtifacts.pac')));
if(archive.sha256!=='0beb089b85dacd42d456dedd2eaf7dc0b4d35541806f857e24a08e2bad5d3893')throw Error('Changed original artifact archive');
const traits=readArtifactTraits(archive.extract('artraits.txt').toString('latin1')),language=JSON.parse(fs.readFileSync(path.join(source,'Lang/TUM_Artifacts.json'))).era.artifacts;
const write=(name,data)=>{const p=path.join(output,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(data)?data:JSON.stringify(data,null,2)+'\n');},definitions={};
for(const id of[260]){
 if(fs.existsSync(path.join(source,'Data/artifacts',id+'.cfg')))throw Error('Additional original260 CFG requires review');
 const trait=traits[id],asset='tum-era/artifacts/'+id,icon=decodeArtifactIcon(archive.extract('artifact.def'),id);
 if(!new RegExp('^HrArt0*'+id+'\\.','i').test(icon.name))throw Error('Original icon identity changed');
 const compiled=compileArtifactDefinition({id,text:'',authorizeAdapters:['wayfarer'],baseArtifact:{type:['HERO'],class:trait.class,value:trait.value,slot:trait.slot,text:normalizeArtifactLanguage(trait,language[id]).text},resolveAssets:()=>({image:asset+'/icon.png',map:asset+'/map.def',scenarioBonus:asset+'/scenario.png'})});
 if(!compiled.ok)throw Error(JSON.stringify(compiled.diagnostics));compiled.definition.text.description="{Wayfarer's Boots}\n\nHuman-controlled heroes cross terrain as if they had Expert Pathfinding. Computer-controlled heroes instead gain 400 extra movement points at the start of each turn.";definitions['artifact'+id]=compiled.definition;
 for(const suffix of['def','msk'])write('content/Sprites/'+asset+'/map.'+suffix,archive.extract('ava'+String(id).padStart(4,'0')+'.'+suffix));
 write('content/Data/'+asset+'/icon.png',encodePng(icon));write('content/Data/'+asset+'/scenario.png',encodePng(scenarioIcon(icon)));
}
write('content/config/wayfarer260.candidate.json',definitions);
write('runtime.candidate.json',validateWayfarer260({schemaVersion:1,artifact:'tum-era:artifact260'}));
write('source-review.json',{ids:[260],scriptSHA256:sha(script),archiveSHA256:archive.sha256,sourceLines:[1398,1430],mechanism:'Human: overwrite only the movement-cost Pathfinding input withExpert3, canonical terrain discount75. AI: once at owning turn OnEveryDay, add400 to remaining points HE:W and current daily maximum HE:G, after ordinary movement regeneration. No AI terrain bypass; no human daily400.',binaryEvidence:'wayfarer260-source.json',nativeState:'ONE_DAY ERA_SOURCE_ARTIFACT_STATE [1,260,day,initialBoatMode] on the hero prevents duplicate new-day receipt on resume. A separate post-multiplier MOVEMENT400 maximum applies only to the current initial land/sea layer; boarding/disembarking removes that maximum, keeps the day receipt and the native scaled/consumed remaining points.',scope:'Source OW:A reads the selected human hero. The native TurnInfo argument is the actual hero being calculated; ordinary mobile path requests use that selected hero, while unrelated native prediction queries do not borrow another hero equipment.',pending:['Native human equipped/backpack/basic/expert/road/ordinary-army terrain costs','Native AI400 remaining andmaximum, no PFterrain discount, no human400','Daily reset, receipt idempotence/save-load, unequipping and unrelated hero guards','AI sea400, post-multiplier Navigation and boat transition reset'],activationReady:false});
console.log('Prepared original260 split human/AI candidate without activation.');
