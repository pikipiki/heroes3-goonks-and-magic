/** Register343/344 and the original daily script together after all source/native gates. Default: review only. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {validateDragonlingEvolution} from './dragonling-evolution-validation.mjs';
import {sourceDragonlingEvolutionPolicy,SOURCE_DRAGONLING_EVOLUTION_CONTRACT} from './dragonling-evolution-source.mjs';
const [stageArg,cfgArg,dailyArg,mode='--check']=process.argv.slice(2);
if(!stageArg||!cfgArg||!dailyArg||!['--check','--apply'].includes(mode))throw Error('STAGE CFG_NATIVE_REPORT DAILY_NATIVE_REPORT [--check|--apply]');
const root='mod/tum-era',stage=path.resolve(stageArg),read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const metadata=read(stage+'/stage.json'),cfg=read(cfgArg),daily=read(dailyArg),ids=[343,344],native=id=>'tum-era:eraCreature'+id;
assert.deepEqual(metadata.sourceIds,ids);assert.equal(metadata.activation,false);assert.equal(metadata.records.length,2);
assert(metadata.records.every(r=>r.nativeId===native(r.eraId)&&!r.obligations.length&&!r.dependencies.length));
const definitionBytes=fs.readFileSync(stage+'/content/config/source-dragonling-pair.json');assert.equal(sha(definitionBytes),metadata.definitionSha256);
assert.equal(cfg.passed,true);assert.equal(cfg.allCfgXpControlsComplete,true);assert.equal(cfg.wholeGlobalPortComplete,true);assert.equal(cfg.report.dragonlingStage.definitionSha256,metadata.definitionSha256);assert.deepEqual(cfg.report.dragonlingStage.records,metadata.records);assert.deepEqual(cfg.report.dragonlingStage.sourcePins,metadata.sourcePins);
for(const key of ['dragonlingStats343R0','dragonlingStats343R10','dragonlingStats344R0','dragonlingStats344R10'])assert(cfg.report[key],key);
assert.equal(cfg.report.faerieDragonlingActualCasting.casts.length,2);assert.equal(cfg.report.rustDragonlingAcidDefenceOnly.hits.length,5);
validateDragonlingEvolution(daily,metadata.definitionSha256);assert.deepEqual(daily.report.dragonlingStage.records,metadata.records);assert.deepEqual(daily.report.dragonlingStage.sourcePins,metadata.sourcePins);
const manifest=read(root+'/mod.json'),identities=read(root+'/era-identities.json'),legacy=read('outputs/wog-priorities-0.4.147/conversion-creatures-source.json'),legacyNative=read('outputs/wog-priorities-0.4.147/native-conversion-artifacts-five.json');assert.equal(legacyNative.passed,true);
const registered=Object.assign({},...manifest.creatures.map(file=>read(root+'/content/'+file)));
const hasActor=(value,key)=>value&&typeof value==='object'&&(value.key===key||Object.values(value).some(v=>hasActor(v,key)));
const contracts={};
for(const id of [341,342,345]){const record=legacy.records.find(r=>r.eraId===id);assert.equal(identities.creatures[id],native(id));assert(registered['eraCreature'+id],'Existing canonical actor must remain registered');assert.equal(record?.nativeId,native(id));assert.equal(record.obligations.length,0);assert.equal(record.dependencies.length,0);assert(hasActor(legacyNative.report,native(id)));contracts[id]={complete:true,nativeValidated:true,active:true,nativeId:native(id)};}
const pending=new Map(),json=(p,v)=>pending.set(p,Buffer.from(JSON.stringify(v,null,2)+'\n'));
for(const record of metadata.records){const id=record.eraId;assert(!identities.creatures[id]||identities.creatures[id]===native(id),'Preserve canonical identity');assert.equal(record.requiredFeaturePolicy.path,'config/era-bridge-'+(id===343?'faerie':'rust')+'-dragonling.json');const service=read(stage+'/content/'+record.requiredFeaturePolicy.path);assert.deepEqual(service,record.requiredFeaturePolicy.service);json(root+'/content/'+record.requiredFeaturePolicy.path,service);
 for(const asset of record.assets){const relative=asset.path;assert(!path.isAbsolute(relative)&&!relative.split('/').includes('..'));const bytes=fs.readFileSync(stage+'/'+relative);assert.equal(sha(bytes),asset.sha256,'Source asset hash '+relative);pending.set(root+'/'+relative,bytes);}
 identities.creatures[id]=native(id);
 // These fresh actors are the same atomic registration being prepared, after actual CFG/XP and global native proofs passed above.
 contracts[id]={complete:true,nativeValidated:true,active:true,nativeId:native(id)};
}
json(root+'/content/config/reviewed-dragonling-pair.json',JSON.parse(definitionBytes));
for(const name of ['era-bridge-experience','era-bridge-skeleton-transformations']){const target=root+'/content/config/'+name+'.json',current=read(target),patch=read(stage+'/patches/'+name+'.json');assert.deepEqual(Object.keys(patch.creatures).sort(),ids.map(native).sort());Object.assign(current.creatures,patch.creatures);json(target,current);}
for(const file of fs.readdirSync(root+'/content/config').filter(n=>/^era-bridge-.*\.json$/.test(n))){const target=root+'/content/config/'+file,current=pending.has(target)?JSON.parse(pending.get(target)):read(target);if(current.sourceIds){for(const id of ids)current.sourceIds[native(id)]=id;json(target,current);}}
json(root+'/content/config/era-bridge-dragonling-evolution.json',sourceDragonlingEvolutionPolicy({contract:SOURCE_DRAGONLING_EVOLUTION_CONTRACT,rebornEnabled:false,actorContracts:contracts}));
json(root+'/era-identities.json',identities);manifest.creatures=[...new Set([...manifest.creatures,'config/reviewed-dragonling-pair.json'])];
json('outputs/wog-priorities-0.4.147/dragonling-evolution-source.json',{active:true,contract:SOURCE_DRAGONLING_EVOLUTION_CONTRACT,sourcePins:metadata.sourcePins,records:metadata.records,definitionSha256:metadata.definitionSha256,cfgNativeEvidence:cfgArg,dailyNativeEvidence:dailyArg,engineSha256:daily.report.engineMetadata.sha256,rebornEnabled:false,adaptations:daily.adaptations});
// Manifest is replaced last; every JSON, dependency, native control and source byte has already been checked.
json(root+'/mod.json',manifest);
if(mode==='--apply')for(const [file,bytes] of pending){fs.mkdirSync(path.dirname(file),{recursive:true});const temporary=file+'.dragonling-install.tmp';fs.writeFileSync(temporary,bytes);fs.renameSync(temporary,file);}
console.log(JSON.stringify({validated:true,applied:mode==='--apply',sourceIds:ids,dailyPairs:5,files:pending.size,engineSha256:daily.report.engineMetadata.sha256}));
