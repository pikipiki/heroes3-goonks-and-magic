/** Install the source-closed Templar/Werewolf dependency component atomically.
 * Native battle/recruitment validation is a release obligation, not inferred
 * from the source compiler. All unrelated definitions and policies are kept.
 */
import fs from 'node:fs';import path from 'node:path';
const review=process.argv[2];if(!review)throw Error('Reviewed source overlay required');
const root='mod/tum-era',read=file=>JSON.parse(fs.readFileSync(file)),write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const report=read(review+'/native-closed-import-review.json'),ids=[269,273,278,331,332];
if(report.sourceTemplarCasterOptIn!=='source-templar-caster-v1'||report.sourceWerewolfExperienceOptIn!=='source-werewolf-experience-v1')throw Error('Explicit reviewed native caster and Werewolf contracts required');
if(ids.some(id=>!report.candidateIds.includes(id)))throw Error('Incomplete Templar/Werewolf dependency component');
const definitions=read(review+'/content/config/native-closed-creatures.candidate.json'),selected={};
for(const id of ids){
 const record=report.records.find(r=>r.eraId===id);if(record.obligations.length)throw Error('Unclosed source actor '+id);
 selected['eraCreature'+id]=definitions['eraCreature'+id];
 if([269,278,331,332].includes(id)&&selected['eraCreature'+id].abilities?.sourceActiveSpellPower?.val!==100)throw Error('Outdated Templar power review: Amethyst5A0145 current-count override required');
 for(const asset of record.assets){const target=root+'/'+asset.path;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(review+'/'+asset.path,target);}
}
const policies=['era-bridge-experience','era-bridge-skeleton-transformations','era-bridge-runtime','era-bridge-experience-attack-spells'];
for(const file of policies){
 const target=root+'/content/config/'+file+'.json',current=read(target),candidate=read(review+'/content/config/'+file+'.candidate.json');
 for(const id of ids){const key='tum-era:eraCreature'+id;if(candidate.creatures[key]!==undefined)current.creatures[key]=candidate.creatures[key];}
 write(target,current);
}
write(root+'/content/config/reviewed-templars.json',selected);
const identities=read(root+'/era-identities.json');for(const id of ids)identities.creatures[id]='tum-era:eraCreature'+id;write(root+'/era-identities.json',identities);
for(const file of fs.readdirSync(root+'/content/config').filter(f=>/^era-bridge-.*\.json$/.test(f))){const target=root+'/content/config/'+file,data=read(target);if(data.sourceIds){for(const id of ids)data.sourceIds['tum-era:eraCreature'+id]=id;write(target,data);}}
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/reviewed-templars.json'])];write(root+'/mod.json',manifest);
const out=process.env.TUM_REVIEW_REPORT||'outputs/wog-priorities-0.4.147/templars-source.json';
write(out,{ids,sourcePins:report.sourcePins,records:report.records.filter(r=>ids.includes(r.eraId)),nativeValidationRequired:true,
 runtime:'Active creature spells use original power/current count/mastery; XP beforeattack uses original mastery3 and the Amethyst current-active-stack power override and original primary gate. Morale floor1 remains subject to Spirit of Oppression.',
 scope:'Five source actors and dependencycomponent. Eighth town tiers stay gated until every original family is complete. NativeAI retains its own scoring.'});
console.log('Prepared five reviewed Templar/Werewolf actors; native validation is required before release.');
