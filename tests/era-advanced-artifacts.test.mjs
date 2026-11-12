import test from 'node:test';import assert from 'node:assert/strict';
import{validateAdvancedArtifactPolicy}from'../scripts/era-bridge/artifacts/advanced-runtime.mjs';
test('Source advanced services bind original identities and exact whole operations',()=>{
 const valid={schemaVersion:1,artifacts:{'tum-era:artifact180':{perceivedStrength:{multiplier:3}},'tum-era:artifact220':{lightningRod:{}}}};
 assert.equal(validateAdvancedArtifactPolicy(valid),valid);
 for(const value of [4,2,3.1,'3'])assert.throws(()=>validateAdvancedArtifactPolicy({schemaVersion:1,artifacts:{'tum-era:artifact180':{perceivedStrength:{multiplier:value}}}}));
 for(const artifacts of [{'core:artifact220':{lightningRod:{}}},{'tum-era:artifact220':{lightningRod:{power:50}}},{'tum-era:artifact180':{lightningRod:{}}}])assert.throws(()=>validateAdvancedArtifactPolicy({schemaVersion:1,artifacts}));
 assert.throws(()=>validateAdvancedArtifactPolicy({...valid,ignoreUnknown:true}));
});
