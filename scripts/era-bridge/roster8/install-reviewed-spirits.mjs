/** Reviewed source349/350 component. Invoke only with rebuilt source splash
 * and source-regeneration services; release still requires gameplay QA.
 */
import fs from 'node:fs';import path from 'node:path';
const review=process.argv[2];if(!review)throw Error('Reviewed source overlay required');
const root='mod/tum-era',read=file=>JSON.parse(fs.readFileSync(file)),write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const report=read(review+'/native-closed-import-review.json'),ids=[349,350];
if(report.sourceSpringSpiritOptIn!=='source-spring-spirit-v1'||report.nativeBiologyOptIn!=='source-biological-flags-inanimate-v1')throw Error('Reviewed Spring Spirit splash/regeneration and exact independent nature required');
if(ids.some(id=>!report.candidateIds.includes(id)))throw Error('Incomplete Spirit dependency component');
const definitions=read(review+'/content/config/native-closed-creatures.candidate.json'),selected={};
for(const id of ids){
 const record=report.records.find(r=>r.eraId===id);if(record.obligations.length)throw Error('Unclosed source actor '+id);
 selected['eraCreature'+id]=definitions['eraCreature'+id];
 for(const asset of record.assets){const target=root+'/'+asset.path;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(review+'/'+asset.path,target);}
}
for(const file of['era-bridge-experience','era-bridge-skeleton-transformations','era-bridge-runtime','era-bridge-experience-attack-spells']){
 const target=root+'/content/config/'+file+'.json',current=read(target),candidate=read(review+'/content/config/'+file+'.candidate.json');
 for(const id of ids){const key='tum-era:eraCreature'+id;if(candidate.creatures[key]!==undefined)current.creatures[key]=candidate.creatures[key];}
 write(target,current);
}
write(root+'/content/config/reviewed-spirits.json',selected);
const identities=read(root+'/era-identities.json');for(const id of ids)identities.creatures[id]='tum-era:eraCreature'+id;write(root+'/era-identities.json',identities);
for(const file of fs.readdirSync(root+'/content/config').filter(f=>/^era-bridge-.*\.json$/.test(f))){const target=root+'/content/config/'+file,data=read(target);if(data.sourceIds){for(const id of ids)data.sourceIds['tum-era:eraCreature'+id]=id;write(target,data);}}
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/reviewed-spirits.json'])];write(root+'/mod.json',manifest);
write(process.env.TUM_REVIEW_REPORT||'outputs/wog-priorities-0.4.147/spirits-source.json',{ids,sourcePins:report.sourcePins,records:report.records.filter(r=>ids.includes(r.eraId)),nativeValidationRequired:true,
 sourceSplash:'Original floor(pixelDistanceSquared/4096)<=1 for either occupiedhex; preserve originalsidefilter includingHypnotize, notjustsixadjacenthexes.',
 sourceDormantFields:'Custom Hypnotize data is inactive withoutSpell effect10. AfterDefendSpell2 is gated by firstAfterDefendSpell, absentin350. ConfirmedshippedDLL; no invented casts.',
 sourceRegeneration:'100HP,100percentchance,source0..99draw evenwhenuninjured/certain. XPp37Cureusesmastery3,current-active-stack power andoriginalprimaryreceptivity.',
 nature:'Independent sourceALIVE0/UNDEAD0 marker preserves source morale and mind behavior. No broad nativeNON_LIVING category is introduced.',
 scope:'Two original source actors and their unconditional upgrade. Original eighth native town recruitment remains atomically gated with other families.'});
console.log('Prepared source Forest Spirit / Spring Spirit; native build and gameplay validation required before release.');
