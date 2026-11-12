/** Isolated full351/352 source candidates; activation needs native controls. */
import fs from'node:fs';import path from'node:path';
const review=path.resolve(process.argv[2]||'/tmp/goonk-dungeon-review-151'),out=path.resolve(process.argv[3]||'/tmp/goonk-dungeon-stage-151');
if(fs.existsSync(out))throw Error('Fresh private output required');
const read=p=>JSON.parse(fs.readFileSync(p)),write=(name,value)=>{const file=path.join(out,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const report=read(review+'/native-closed-import-review.json'),records=[351,352].map(id=>report.records.find(r=>r.eraId===id));
if(report.sourceDungeonOptIn!=='source-dungeon-eighth-v1'||records.some(r=>!report.candidateIds.includes(r?.eraId)||r.obligations.length))throw Error('Whole351/352 source contract required');
const all=read(review+'/content/config/native-closed-creatures.candidate.json');
const descriptions={351:'Rayon blanc, sans pénalité de distance ni de muraille. Avec l’expérience, peut ralentir la cible après l’attaque.',352:'Chaîne de quatre cibles au maximum, sans tenir compte de l’attaque, de la défense ni de la distance. Chaque saut divise les dégâts par deux et s’arrête au premier allié rencontré. Avec l’expérience, peut annuler Hâte sans ralentir davantage.'};
write('content/config/source-dungeon.json',Object.fromEntries(records.map(r=>['eraCreature'+r.eraId,{...all['eraCreature'+r.eraId],description:descriptions[r.eraId]}])));
for(const r of records)for(const a of r.assets){const target=path.join(out,a.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(review+'/'+a.path,target);}
for(const name of['era-bridge-experience','era-bridge-skeleton-transformations']){const candidate=read(review+'/content/config/'+name+'.candidate.json');write('patches/'+name+'.json',{schemaVersion:1,creatures:Object.fromEntries(records.map(r=>[r.nativeId,candidate.creatures[r.nativeId]]))});}
write('patches/era-bridge-status-attacks.json',{schemaVersion:1,creatures:records.map(r=>r.nativeId),sourceIds:Object.fromEntries(records.map(r=>[r.nativeId,r.eraId]))});
write('content/config/source-dungeon-spells.json',read(review+'/content/config/source-dungeon-spells.candidate.json'));
write('stage.json',{sourceIds:[351,352],creatures:['config/source-dungeon.json'],spells:['config/source-dungeon-spells.json'],sourcePins:report.sourcePins,records,activation:false,nativeValidationRequired:true,undefinedSourceException:{secondPhysicalPass:0,reason:'Original EAX after void LeaveCriticalSection is ABI-undefined; owner authorized stable correction.'},requiredNativeControls:['originalStatsAndExperience','whiteRayDistanceAndWallControl','c54NativeRankChanceAndCurrentActorDuration','c54ZeroPowerRemovesHasteWithoutSlow','chainRawDamageAndAmmo','chain4HalvingAndFinalRngScan','chainNearestPixelAndTieOrder','chainFriendlyTermination','chainResistanceAndOrbAndRod','chainFullBlockPartialBlockAndZeroSecondPass','chainCloneAndQueuedStatusOrdering','portraitAndLandscapeArcAnchors']});
console.log(JSON.stringify({out,activation:false,actors:[351,352]}));
