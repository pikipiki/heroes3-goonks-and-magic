/** Fail closed before registering the original343/344 actors or daily script. */
import assert from 'node:assert/strict';
export const EVOLUTION_NATIVE_CONTROLS=Object.freeze(['dragonlingSameDaySaveLoad','dragonlingDailyThresholdCountBanner','dragonlingAllFiveTargets','dragonlingEvolvedSaveLoad','dragonlingRebornSuppression','dragonlingEmeraldBeforeEvolution','dragonlingTownArmyExcluded','dragonlingGarrisonHeroIncluded','dragonlingOwningPlayerOnly']);
const slots=s=>s.armies[0].slots;
const same=(a,b)=>assert.deepEqual(a.map(u=>u&&[u.key,u.count,u.experience]),b.map(u=>u&&[u.key,u.count,u.experience]));
const grown=(a,b,key)=>{assert.equal(b.key,key);assert.equal(b.count,a.count);assert.equal(b.experience,0);assert.equal(b.experienceRank,0);};
export function validateDragonlingEvolution(proof,definitionSha256){
 assert.equal(proof.passed,true);assert.equal(proof.allControlsComplete,true);
 const r=proof.report;assert(r);for(const key of EVOLUTION_NATIVE_CONTROLS)assert(r[key],'Missing native control '+key);
 assert.match(r.engineMetadata?.sha256||'',/^[a-f0-9]{64}$/);assert.equal(r.dragonlingStage?.definitionSha256,definitionSha256);
 const d=r.dragonlingDailyThresholdCountBanner,a=slots(d.before),b=slots(d.after);for(let i=0;i<5;i++){assert.equal(a[i].key,'tum-era:eraCreature'+(341+i));assert.equal(a[i].experienceRank,i?10:9);assert.equal(b[i].count,a[i].count);if(i)grown(a[i],b[i],['','core:redDragon','core:fairieDragon','core:rustDragon','core:azureDragon'][i]);else assert.deepEqual([b[i].key,b[i].experience,b[i].experienceRank],[a[i].key,a[i].experience,9]);}
 const banner=s=>s.troopEquipment.troops.find(t=>t.slot===2).equipped.id;
 assert.equal(banner(d.equipped),banner(d.after));assert.equal(d.handoff.red.dialogs.filter(x=>JSON.stringify(x).includes('ont grandi')).length,4);
 const saved=r.dragonlingSameDaySaveLoad;assert(saved.savedBytes>0);same(slots(saved.before),slots(saved.restored));assert.equal(saved.before.day,saved.restored.day);assert.equal(banner(saved.equipped),banner(saved.restored));
 const all=r.dragonlingAllFiveTargets;assert(slots(all.second)[0].experienceRank>=10);grown(slots(all.second)[0],slots(all.green)[0],'core:greenDragon');assert.equal(banner(d.after),banner(all.green));
 assert(r.dragonlingEvolvedSaveLoad.savedBytes>0);same(slots(all.green),slots(r.dragonlingEvolvedSaveLoad.loaded));assert.equal(banner(all.green),banner(r.dragonlingEvolvedSaveLoad.loaded));
 const reborn=r.dragonlingRebornSuppression;assert(slots(reborn.before).slice(0,5).every(u=>u.experienceRank===10));same(slots(reborn.before),slots(reborn.after));
 const eye=r.dragonlingEmeraldBeforeEvolution,eyeA=slots(eye.before)[0],eyeB=slots(eye.after)[0];assert.equal(eyeA.key,'tum-era:eraCreature343');assert.equal(eyeA.experienceRank,10);assert.equal(eyeB.key,'tum-era:eraCreature258');assert.deepEqual([eyeB.count,eyeB.experience],[eyeA.count,eyeA.experience]);
 const town=r.dragonlingTownArmyExcluded,townId=town.before.towns[0].id,ta=town.inTown.armies.find(x=>x.id===townId).slots[1],tb=town.townAfter.armies.find(x=>x.id===townId).slots[1];assert.equal(ta.experienceRank,10);assert.equal(ta.key,'tum-era:eraCreature344');same([ta],[tb]);
 const g=r.dragonlingGarrisonHeroIncluded;assert.equal(g.garrisonBefore.armies.length,1);assert.equal(g.garrisonBefore.armies[0].id,town.before.armies[0].id);grown(g.garrisonBefore.armies[0].slots[0],g.garrisonAfter.armies[0].slots[0],'core:rustDragon');
 const owner=r.dragonlingOwningPlayerOnly,initial=slots(owner.before)[0];assert.equal(initial.experienceRank,10);assert.equal(owner.initial.totalExperience,initial.experience);assert(owner.initial.totalExperience>0);assert.deepEqual([owner.observed.key,owner.observed.count,owner.observed.totalExperience],[owner.initial.key,owner.initial.count,owner.initial.totalExperience]);assert.equal(owner.blue.state.day,owner.before.day);assert(owner.red.state.day>owner.blue.state.day);grown(initial,slots(owner.after)[0],'core:fairieDragon');
 return true;
}
