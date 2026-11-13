import{sourceConfluxFireWallTrigger,sourceConfluxFeaturePolicy}from'./conflux-source.mjs';import{readJsonc}from'../objects/production-resolvers.mjs';
/** Whole355/356 isolated source candidates. No active mod is changed. */
import fs from'node:fs';import path from'node:path';
const[reviewArg='/tmp/goonk-conflux-review155b',outArg='/tmp/goonk-conflux-stage155']=process.argv.slice(2),review=path.resolve(reviewArg),out=path.resolve(outArg),read=p=>JSON.parse(fs.readFileSync(p)),write=(name,v)=>{const p=path.join(out,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const report=read(review+'/native-closed-import-review.json'),records=[355,356].map(id=>report.records.find(r=>r.eraId===id));
if(report.nativeConfluxOptIn!=='source-conflux-eighth-v1'||records.some(r=>!report.candidateIds.includes(r?.eraId)||r.obligations.length))throw Error('Whole355/356 source contract incomplete');
const all=read(review+'/content/config/native-closed-creatures.candidate.json');
const descriptions={355:'Se téléporte. Lance une Flèche magique après une attaque au corps à corps, un Mur de feu après une défense et Bouclier de feu après une blessure.',356:'Se téléporte. Magie féerique et canalisation de mana. Invoque des élémentaires au deuxième tour selon son expérience. Rend disponibles les sorts d’eau.'};
write('content/config/source-conflux.json',Object.fromEntries(records.map(r=>['eraCreature'+r.eraId,{...all['eraCreature'+r.eraId],description:descriptions[r.eraId]}])));
for(const r of records)for(const a of r.assets){const p=path.join(out,a.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(review+'/'+a.path,p);}
for(const name of['era-bridge-experience','era-bridge-skeleton-transformations','era-bridge-runtime']){const candidate=read(review+'/content/config/'+name+'.candidate.json');write('patches/'+name+'.json',{schemaVersion:1,creatures:Object.fromEntries(records.map(r=>[r.nativeId,candidate.creatures[r.nativeId]??{}]))});}
write('content/config/era-bridge-conflux.json',sourceConfluxFeaturePolicy());
write('content/config/source-conflux-spells.json',{sourceConfluxFireWallTrigger:sourceConfluxFireWallTrigger(readJsonc('work/vcmi-wasm/config/spells/other.json').fireWallTrigger)});
write('stage.json',{sourceIds:[355,356],creatures:['config/source-conflux.json'],spells:['config/source-conflux-spells.json'],sourcePins:report.sourcePins,records,activation:false,nativeValidationRequired:true,featureContract:'source-conflux-eighth-v1',dormantSourceKeys:{355:['isSorceress'],356:['ACAST_CUSTOM_Chance','ACAST_CUSTOM_Spell']},availableSpellCache:{artifact:88,permanentLearning:false,serialized:true,armyRemovalRetainsCache:true,spellArtifactChangeClearsCache:true,ordinaryWeaponChangeRetainsCache:true,backpackReorderRetainsCache:true}});
console.log(JSON.stringify({out,actors:[355,356],activation:false}));
