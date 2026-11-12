import test from 'node:test';import assert from 'node:assert/strict';
import{compileArtifact}from'../scripts/era-bridge/artifacts/artifacts.mjs';
import{validateMassHypnotize253}from'../scripts/era-bridge/artifacts/mass-hypnotize253.mjs';
test('Only artifact253 may bind source mass Hypnotize with explicit50 duration',()=>{
 const args={id:253,text:'Autospell=60',resolveSpell:id=>id===60?'core:hypnotize':null,includeCombination:false,includeSpecials:false};
 const blocked=compileArtifact(args);assert(blocked.adapters.some(a=>a.kind==='artifactFixedPowerOpeningSpell'));
 const bound=compileArtifact({...args,fixedPowerOpeningSpellContract:'source-mass-hypnotize253-v1'});assert.deepEqual(bound.patch.bonuses.Autospell,{type:'OPENING_BATTLE_SPELL',val:50,subtype:'core:hypnotize',addInfo:[3,0]});assert.equal(bound.adapters.length,0);
 const unrelated=compileArtifact({...args,id:254,fixedPowerOpeningSpellContract:'source-mass-hypnotize253-v1'});assert(unrelated.adapters.some(a=>a.kind==='artifactFixedPowerOpeningSpell'));
 const policy={schemaVersion:1,artifact:'tum-era:artifact253'};assert.deepEqual(validateMassHypnotize253(policy),policy);
 for(const bad of[{...policy,artifact:'tum-era:artifact254'},{...policy,schemaVersion:2},{...policy,allTargetedSpells:true}])assert.throws(()=>validateMassHypnotize253(bad));
});
