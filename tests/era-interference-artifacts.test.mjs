import test from'node:test';import assert from'node:assert/strict';
import{validateInterferencePolicy}from'../scripts/era-bridge/artifacts/interference-runtime.mjs';
import{interferencePower}from'../scripts/era-bridge/artifacts/runtime.mjs';
test('Only original269/27010percent and27125percent cached battle contracts are accepted',()=>{
 const policy={schemaVersion:1,artifacts:{'tum-era:artifact269':{interference:{percent:10}},'tum-era:artifact270':{interference:{percent:10}},'tum-era:artifact271':{interference:{percent:25}}}};
 assert.deepEqual(validateInterferencePolicy(policy),policy);
 for(const bad of[{...policy,schemaVersion:2},{schemaVersion:1,artifacts:{'tum-era:artifact271':{interference:{percent:10}}}},{schemaVersion:1,artifacts:{'tum-era:artifact264':{interference:{percent:10}}}},{schemaVersion:1,artifacts:{'tum-era:artifact269':{interference:{percent:10,stacking:true}}}}])assert.throws(()=>validateInterferencePolicy(bad));
 assert.equal(interferencePower({heroPower:13,charm:true,seal:true,plate:true}),7);
 assert.equal(interferencePower({heroPower:0,charm:true}),1);
 assert.equal(interferencePower({heroPower:0}),0);
});
