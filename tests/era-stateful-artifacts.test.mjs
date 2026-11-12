import test from'node:test';import assert from'node:assert/strict';
import{validateStatefulArtifactPolicy}from'../scripts/era-bridge/artifacts/stateful-runtime.mjs';
test('Stored primary adjustments bind only original264/265 exact contracts',()=>{
 const policy={schemaVersion:1,artifacts:{'tum-era:artifact264':{storedEqualization:{}},'tum-era:artifact265':{storedEqualization:{}}}};
 assert.deepEqual(validateStatefulArtifactPolicy(policy),policy);
 for(const bad of[
  {...policy,schemaVersion:2}, {...policy,extra:true},
  {schemaVersion:1,artifacts:{'tum-era:artifact261':{storedEqualization:{}}}},
  {schemaVersion:1,artifacts:{'tum-era:artifact264':{storedEqualization:{automatic:true}}}},
  {schemaVersion:1,artifacts:{'tum-era:artifact265':{storedEqualization:[]}}},
  {schemaVersion:1,artifacts:{'tum-era:artifact265':{equalPowerKnowledge:{}}}},
 ])assert.throws(()=>validateStatefulArtifactPolicy(bad));
});
