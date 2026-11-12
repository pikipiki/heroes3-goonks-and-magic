/** Promote the complete Coatl/Quetzalcoatl family only after native controls.
 * HATE target identities remain conditional; no unfinished neutral is created. */
import fs from 'node:fs';import path from 'node:path';
import {SOURCE_STRONGHOLD_CONTRACT} from './stronghold-source.mjs';
const review=process.argv[2],evidence=process.argv[3]||'outputs/wog-priorities-0.4.147';
if(!review)throw Error('Usage: REVIEW NATIVE_EVIDENCE_DIRECTORY');
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const r=read(review+'/native-closed-import-review.json');
if(r.sourceStrongholdOptIn!==SOURCE_STRONGHOLD_CONTRACT||[275,283].some(id=>!r.candidateIds.includes(id)||r.records.find(x=>x.eraId===id)?.obligations.length))throw Error('Whole original Stronghold family source contract required');
const native={};for(const suffix of ['stats','spells','fire-shield','spread','hate','upgrade']){native[suffix]=read(evidence+'/native-stronghold-'+suffix+'.json');if(native[suffix].passed!==true)throw Error('Missing native '+suffix+' validation');}
for(const id of [275,283])for(const spell of ['slow','fireball','deathRipple'])if(!native.spells.report[id+'-'+spell])throw Error('Incomplete hero-spell controls');
if(!(native['fire-shield'].report['275-fireShield'].damage>0)||native['fire-shield'].report['283-fireShield'].damage!==0)throw Error('Original fire-shield immunity controls required');
for(const caster of ['core:magog','core:powerLich'])for(const[id,primary]of [[275,false],[283,false],[283,true]]){
 const row=native.spread.report[caster+'-'+id+'-'+primary];if(!row||(id===283&&!primary?row.damage!==0:!(row.damage>0)))throw Error('Incomplete secondary damage controls');
}
for(const id of [275,283])for(const target of [4,274,282])if(native.hate.report[id+'-hate-'+target]?.damage!==(target===4?10:30))throw Error('Deferred source HATE controls required');
if(native.upgrade.report.upgrade?.army.slots[0].key!=='tum-era:eraCreature283'||native.upgrade.report.upgrade.army.slots[1].key!=='goonk:bubu')throw Error('Paid upgrade/Goonk preservation required');
const root='mod/tum-era',all=read(review+'/content/config/native-closed-creatures.candidate.json'),selected={};
for(const id of [275,283]){
 const record=r.records.find(x=>x.eraId===id);selected['eraCreature'+id]=all['eraCreature'+id];
 selected['eraCreature'+id].description=id===275?'Flies. Experience improves damage against Illithids and Alhoons.':'Flies. Clears harmful statuses after each action. Blocks death stare, acid, thunder, death ripple, reflected fire shield and secondary Lich/Magog damage. Experience improves retaliations and damage against Illithids and Alhoons.';
 for(const asset of record.assets){const p=root+'/'+asset.path;fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(review+'/'+asset.path,p);}
}
write(root+'/content/config/reviewed-stronghold.json',selected);
for(const file of ['era-bridge-experience','era-bridge-skeleton-transformations']){
 const p=root+'/content/config/'+file+'.json',current=read(p),candidate=read(review+'/content/config/'+file+'.candidate.json');
 for(const id of [275,283])current.creatures['tum-era:eraCreature'+id]=candidate.creatures['tum-era:eraCreature'+id];write(p,current);
}
const identities=read(root+'/era-identities.json');for(const id of [275,283])identities.creatures[id]='tum-era:eraCreature'+id;write(root+'/era-identities.json',identities);
for(const file of fs.readdirSync(root+'/content/config').filter(f=>/^era-bridge-.*\.json$/.test(f))){const p=root+'/content/config/'+file,current=read(p);if(current.sourceIds){for(const id of [275,283])current.sourceIds['tum-era:eraCreature'+id]=id;write(p,current);}}
const manifest=read(root+'/mod.json');manifest.creatures=[...new Set([...manifest.creatures,'config/reviewed-stronghold.json'])];write(root+'/mod.json',manifest);
write(evidence+'/stronghold-source.json',{ids:[275,283],active:true,contract:SOURCE_STRONGHOLD_CONTRACT,sourcePins:r.sourcePins,records:r.records.filter(x=>[275,283].includes(x.eraId)),nativeReports:Object.keys(native).map(s=>'native-stronghold-'+s+'.json'),sourceHate:'Original20percent perrank against source274/282. Native conditional parameters resolve only actual registered source targets; no placeholder target or omitted bonus.',scope:'Whole original family; nine-town eighth recruitment option is still gated independently.'});
console.log('Installed complete original Coatl/Quetzalcoatl after22 native controls.');
