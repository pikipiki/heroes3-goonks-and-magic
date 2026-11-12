/** Install the complete source actors needed by four daily-conversion artifacts.
 * Input is a strict source-pinned review; all other candidates remain excluded.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [overlay,reportArg]=process.argv.slice(2);if(!overlay)throw Error('Strict isolated creature review required');
const root='mod/tum-era',reportDir=reportArg||'outputs/wog-priorities-0.4.147';
const ids=[318,341,342,345],read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const report=read(overlay+'/native-closed-import-review.json');
if(report.nativeRandomExclusionOptIn!=='source-random-exclusion-v1'||ids.some(id=>!report.candidateIds.includes(id)))throw Error('Missing exact conversion actor contracts');
const all=read(overlay+'/content/config/native-closed-creatures.candidate.json'),definitions={};
for(const id of ids){
 const record=report.records.find(r=>r.eraId===id);if(record.obligations.length)throw Error('Unclosed conversion source actor '+id);
 const definition=all['eraCreature'+id];if(id>=341&&definition.special!==true)throw Error('Source random exclusion missing');
 definitions['eraCreature'+id]=definition;
 for(const asset of record.assets){
  const bytes=fs.readFileSync(path.join(overlay,asset.path));
  if(asset.sha256&&crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Altered reviewed asset');
  const target=path.join(root,asset.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
 }
}
write(root+'/content/config/reviewed-conversion-creatures.json',definitions);
for(const config of ['era-bridge-experience','era-bridge-skeleton-transformations']){
 const target=root+'/content/config/'+config+'.json',current=read(target),candidate=read(overlay+'/content/config/'+config+'.candidate.json');
 for(const id of ids)current.creatures['tum-era:eraCreature'+id]=candidate.creatures['tum-era:eraCreature'+id];write(target,current);
}
const runtimeFile=root+'/content/config/era-bridge-runtime.json',runtime=read(runtimeFile),sourceRuntime=read(overlay+'/content/config/era-bridge-runtime.candidate.json');
if(JSON.stringify(sourceRuntime.creatures['tum-era:eraCreature318'])!==JSON.stringify({deathBlowCRT:{}}))throw Error('Unexpected Archer Rider service');
runtime.creatures['tum-era:eraCreature318']=sourceRuntime.creatures['tum-era:eraCreature318'];write(runtimeFile,runtime);
const identities=read(root+'/era-identities.json');for(const id of ids)identities.creatures[id]='tum-era:eraCreature'+id;write(root+'/era-identities.json',identities);
for(const file of fs.readdirSync(root+'/content/config').filter(f=>/^era-bridge-.*\.json$/.test(f))){const target=root+'/content/config/'+file,data=read(target);if(!data.sourceIds)continue;for(const id of ids)data.sourceIds['tum-era:eraCreature'+id]=id;write(target,data);}
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/reviewed-conversion-creatures.json'])];write(root+'/mod.json',manifest);
write(reportDir+'/conversion-creatures-source.json',{ids,records:report.records.filter(r=>ids.includes(r.eraId)),sourcePins:report.sourcePins,
 randomExclusion:{source:['Amethyst2/amethyst/tables.cpp1382','GameMgr_GetRandMonster_ByLevel.cpp35','dllmain.cpp1064'],native:['lib/CCreatureHandler.cpp:getDefaultAllowed','lib/json/JsonRandom.cpp:loadCreatureType','lib/rmg/modificators/ObjectManager.cpp:chooseGuard','mapeditor/inspector/armywidget.cpp39..46 enumerates special creatures for explicit armies'],scope:'Exclude random monster selection and RMG guards, retain explicit authored armies and editor selection.'},
 archerRiderGlobalScriptReview:'MON_ARCHER_RIDER appears only in constant declaration in supplied ERM source; CFG and XP use existing scoped native deathBlowCRT and defense adapters.',nativeValidationRequired:true});
console.log('Installed four complete conversion prerequisites for native validation.');
