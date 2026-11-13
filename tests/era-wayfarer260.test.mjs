import test from'node:test';import assert from'node:assert/strict';
import{compileArtifact}from'../scripts/era-bridge/artifacts/artifacts.mjs';
import{validateWayfarer260}from'../scripts/era-bridge/artifacts/wayfarer260.mjs';
test('Original260 binds only the complete human/AI split, not a generic inherited movement aura',()=>{
 const unresolved=compileArtifact({id:260});assert(unresolved.adapters.some(a=>a.kind==='wayfarer'));assert.equal(unresolved.ok,false);
 const bound=compileArtifact({id:260,authorizeAdapters:['wayfarer']});assert.equal(bound.ok,true);assert.deepEqual(bound.patch.bonuses,{});
 const policy={schemaVersion:1,artifact:'tum-era:artifact260'};assert.deepEqual(validateWayfarer260(policy),policy);
 for(const bad of[{...policy,artifact:'tum-era:artifact261'},{...policy,noTerrainPenalty:true},{...policy,aiDaily:600},{...policy,schemaVersion:2}])assert.throws(()=>validateWayfarer260(bad));
});
