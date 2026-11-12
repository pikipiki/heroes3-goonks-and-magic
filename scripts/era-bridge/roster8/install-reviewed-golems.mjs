/** Reviewed source271/280 component. Invoke only with the rebuilt native
 * preemptive-retaliation service available; release still requires gameplay QA.
 */
import fs from 'node:fs';import path from 'node:path';
const review=process.argv[2];if(!review)throw Error('Reviewed source overlay required');
const root='mod/tum-era',read=file=>JSON.parse(fs.readFileSync(file)),write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const report=read(review+'/native-closed-import-review.json'),ids=[271,280];
if(report.sourceGolemExperienceOptIn!=='source-golem-experience-v1'||report.nativeBiologyOptIn!=='source-biological-flags-inanimate-v1')throw Error('Reviewed Golem retaliation/deflection and exact independent nature required');
if(ids.some(id=>!report.candidateIds.includes(id)))throw Error('Incomplete Golem dependency component');
const definitions=read(review+'/content/config/native-closed-creatures.candidate.json'),selected={};
for(const id of ids){
 const record=report.records.find(r=>r.eraId===id);if(record.obligations.length)throw Error('Unclosed source actor '+id);
 selected['eraCreature'+id]=definitions['eraCreature'+id];
 for(const asset of record.assets){const target=root+'/'+asset.path;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(review+'/'+asset.path,target);}
}
for(const file of['era-bridge-experience','era-bridge-skeleton-transformations','era-bridge-runtime']){
 const target=root+'/content/config/'+file+'.json',current=read(target),candidate=read(review+'/content/config/'+file+'.candidate.json');
 for(const id of ids){const key='tum-era:eraCreature'+id;if(candidate.creatures[key]!==undefined)current.creatures[key]=candidate.creatures[key];}
 write(target,current);
}
write(root+'/content/config/reviewed-golems.json',selected);
const identities=read(root+'/era-identities.json');for(const id of ids)identities.creatures[id]='tum-era:eraCreature'+id;write(root+'/era-identities.json',identities);
for(const file of fs.readdirSync(root+'/content/config').filter(f=>/^era-bridge-.*\.json$/.test(f))){const target=root+'/content/config/'+file,data=read(target);if(data.sourceIds){for(const id of ids)data.sourceIds['tum-era:eraCreature'+id]=id;write(target,data);}}
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/reviewed-golems.json'])];write(root+'/mod.json',manifest);
write(process.env.TUM_REVIEW_REPORT||'outputs/wog-priorities-0.4.147/golems-source.json',{ids,sourcePins:report.sourcePins,records:report.records.filter(r=>ids.includes(r.eraId)),nativeValidationRequired:true,
 sourceRetaliation:'Before_Melee at441ADE executes one preemptive hit; native service preserves the following ordinary retaliation if counters remain. Normal FIRST_STRIKE would incorrectly suppress that second counter.',
 nature:'Independent sourceALIVE0/UNDEAD0 marker plus explicit MIND_IMMUNITY and NO_MORALE. Does not add broad nativeNON_LIVING spell exclusions.',
 scope:'Two original source actors and their unconditional upgrade. Original eighth native town recruitment remains atomically gated with other families.'});
console.log('Prepared source Drake Golem / Dragon Golem; native build and gameplay validation required before release.');
