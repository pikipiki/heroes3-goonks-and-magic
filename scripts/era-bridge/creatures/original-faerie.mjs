import assert from 'node:assert/strict';
export const SOURCE_ORIGINAL_FAERIE_CONTRACT='source-original-faerie134-v1';
export function reviewedOriginalFaerie(review){
 assert.equal(review?.schemaVersion,1);
 assert.equal(review.contract,SOURCE_ORIGINAL_FAERIE_CONTRACT);
 assert.equal(review.sourceCreatureId,134);
 assert.equal(review.actor,'core:fairieDragon');
 assert.match(review.engineSHA256,/^[a-f0-9]{64}$/);
 assert.equal(review.passed,true);
 assert.equal(review.complete,true,'Original134 requires the protected Sorcery control as well as the28 original pairs');
 assert.equal(review.nativeControlGroups,29);
 assert.equal(review.native?.passed,true);
 assert.deepEqual(review.native.errors,[]);
 const spells=[15,16,17,19,20,21,22,23];
 assert.deepEqual(Object.keys(review.native.report).map(Number).sort((a,b)=>a-b),spells);
 for(const id of spells){
  const group=review.native.report[id],draws=id<=17?0:id===19?10:id===20?2:3;
  assert.equal(group.expectedResistanceDraws,draws);
  assert.equal(group.uniformRolls.length,draws);
  const {control,cast}=group;
  assert.equal(control.cast,false);assert.equal(cast.cast,true);
  assert.equal(control.beforeRng.value,cast.beforeRng.value);
  assert.equal(control.sourceCount,cast.sourceCount);
  assert.equal(control.seed,cast.seed);
  for(const trial of [control,cast]){
   assert.equal(trial.id,id);assert.equal(trial.actor,'core:fairieDragon');
   assert(Number.isSafeInteger(trial.sourceCount)&&trial.sourceCount>=2);
   assert.equal(trial.sourcePower,trial.sourceCount*5);
   assert.equal(trial.originalCharges,5);
   assert.equal(trial.remainingCasts,trial.originalCharges+trial.ownedAdditionalCharges-(trial.cast?1:0));
  }
  assert(Object.values(control.changes).every(value=>value===0));
  assert(cast.changes['core:ogre']<0||id===20);
  if(draws===0){
   assert.equal(group.actualMinstdAdvances,0);
   assert.equal(control.afterRng.value,cast.afterRng.value);
   assert.equal(cast.changes['goonk:bubu'],0);
  }else{
   assert(group.actualMinstdAdvances>=draws);
   assert(cast.changes['goonk:bubu']<0);
  }
 }
 for(const [name,ids] of [['secondaryImmunity',[20,21,22,23]],['blockedPrimary',spells],['heroCorrection',spells]]){
  const suite=review[name];assert.equal(suite?.passed,true);assert.deepEqual(suite.errors,[]);
  assert.deepEqual(Object.keys(suite.report).map(Number).sort((a,b)=>a-b),ids);
  for(const id of ids){
   const {control,cast}=suite.report[id];assert.equal(control.cast,false);assert.equal(cast.cast,true);
   for(const trial of [control,cast]){
    assert.equal(trial.actor,'core:fairieDragon');assert.equal(trial.sourceCount,review.native.report[id].cast.sourceCount);
    assert.equal(trial.sourcePower,trial.sourceCount*5);
   }
   assert.equal(control.beforeRng.value,cast.beforeRng.value);
   if(name==='secondaryImmunity'){
    assert.equal(cast.secondaryResistance,100);assert.equal(cast.changes['core:skeleton'],0);
    assert(cast.changes['goonk:bubu']<0);assert.equal(cast.remainingCasts,54);
   }else if(name==='blockedPrimary'){
    assert.equal(cast.blockedPrimary,true);assert.equal(cast.remainingCasts,55);
    assert(Object.values(cast.changes).every(value=>value===0));
    assert.equal(suite.report[id].expectedResistanceDraws,0);
    assert.equal(cast.afterRng.value,control.afterRng.value);
   }else{
    assert.equal(cast.sorcery,true);assert.equal(cast.remainingCasts,54);
    for(const [creature,damage] of Object.entries(review.native.report[id].cast.changes))
     assert.equal(cast.changes[creature],id<=17?damage:Math.trunc(damage*115/100));
   }
  }
 }
 const protection=review.protectionOrder;
 assert.equal(protection?.passed,true);assert.deepEqual(protection.errors,[]);
 assert.deepEqual(Object.keys(protection.report),['19']);
 const protectedCast=protection.report[19].cast;
 assert.equal(protectedCast.actor,'core:fairieDragon');
 assert.equal(protectedCast.sourceCount,2);assert.equal(protectedCast.sourcePower,10);
 assert.equal(protectedCast.protection,true);assert.equal(protectedCast.sorcery,true);
 assert.equal(protectedCast.changes['core:fairieDragon'],-22);
 assert.equal(protectedCast.remainingCasts,54);
 assert.equal(protection.report[19].expectedResistanceDraws,10);
 return {schemaVersion:1,creature:'core:fairieDragon'};
}
