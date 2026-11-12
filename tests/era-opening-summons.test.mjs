import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRuntimePolicy,mergeRuntimePolicies} from '../scripts/era-bridge/runtime-policy.mjs';
import {compileArtifact} from '../scripts/era-bridge/artifacts/artifacts.mjs';

test('Opening summons require an explicit native binding and preserve source order/power',()=>{
 const input={id:279,text:'AutosummonPower=-2300\nAutosummon=357\nAutosummon2=13\nAutosummon2Power=7',resolveCreature:id=>'core:creature'+id};
 assert.equal(compileArtifact(input).ok,false);
 const compiled=compileArtifact({...input,authorizeAdapters:['artifactOpeningSummons']});
 assert.equal(compiled.ok,true);
 assert.deepEqual(compiled.adapters[0].summons.map(s=>[s.creature,s.sourcePower]),[['core:creature357',-2300],['core:creature13',7]]);
});
test('Artifact runtime merges summoning and conversion services without accepting unknown keys',()=>{
 const base={schemaVersion:1,creatures:{},artifacts:{'tum-era:artifact219':{openingSummons:[{creature:'third-upgrades:tumHurricaneElemental',encodedPower:0}]}}};
 assert.deepEqual(validateRuntimePolicy(base),base);
 const conversion={schemaVersion:1,creatures:{},artifacts:{'tum-era:artifact223':{dailyConversions:[{from:'core:mage',to:'core:lich'}]}}};
 assert.deepEqual(Object.keys(mergeRuntimePolicies([base,conversion]).artifacts),['tum-era:artifact219','tum-era:artifact223']);
 for(const value of [1.5,NaN,2147483648,-2147483649]){
  const bad=structuredClone(base);bad.artifacts['tum-era:artifact219'].openingSummons[0].encodedPower=value;
  assert.throws(()=>validateRuntimePolicy(bad),/opening summons/);
 }
 const unknown=structuredClone(base);unknown.artifacts['tum-era:artifact219'].silentlyIgnore=true;
 assert.throws(()=>validateRuntimePolicy(unknown),/artifact services/);
});
test('Named source artifact services cannot be reassigned or silently weakened',()=>{
 const services={'tum-era:artifact261':{exchangeCloak:{}},'tum-era:artifact262':{massSpells:{spells:['core:resurrection','core:animateDead'],powerPercent:30}},'tum-era:artifact263':{massSpells:{spells:['core:implosion'],powerPercent:30}},'tum-era:artifact179':{goldenGoose:{countBackpack:false}},'tum-era:artifact181':{reflection:{resistanceBonus:20}},'tum-era:artifact197':{elementalFreedom:{}}};
 const document=artifacts=>({schemaVersion:1,creatures:{},artifacts});
 assert.deepEqual(validateRuntimePolicy(document(services)).artifacts,services);
 for(const [id,service]of Object.entries(services))assert.throws(()=>validateRuntimePolicy(document({'tum-era:artifact200':service})),undefined,'Source operation is bound to original identity '+id);
 for(const change of [{massSpells:{spells:['core:implosion'],powerPercent:31}},{massSpells:{spells:['core:armageddon'],powerPercent:30}}])assert.throws(()=>validateRuntimePolicy(document({'tum-era:artifact263':change})));
 assert.throws(()=>validateRuntimePolicy(document({'tum-era:artifact181':{reflection:{resistanceBonus:25}}})));
 assert.throws(()=>validateRuntimePolicy(document({'tum-era:artifact179':{goldenGoose:{countBackpack:1}}})));
});
test('Mine opening has a separate fixed50 expert binding without enabling targeted Hypnotize',()=>{
 const input={id:222,text:'Autospell=11',resolveSpell:id=>'core:landMine'};
 assert.equal(compileArtifact(input).ok,false);
 const mine=compileArtifact({...input,fixedPowerOpeningSpellContract:'source-fixed50-mine-v1'});
 assert.equal(mine.ok,true);assert.deepEqual(mine.patch.bonuses.Autospell,{type:'ERA_FIXED_POWER_OPENING_SPELL',val:50,subtype:'core:landMine',addInfo:[3,0]});
 assert.equal(compileArtifact({...input,text:'Autospell=60',fixedPowerOpeningSpellContract:'source-fixed50-mine-v1'}).ok,false);
});
