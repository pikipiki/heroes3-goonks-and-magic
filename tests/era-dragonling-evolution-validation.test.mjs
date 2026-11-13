import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateDragonlingEvolution,EVOLUTION_NATIVE_CONTROLS} from '../scripts/era-bridge/roster8/dragonling-evolution-validation.mjs';
import {sourceDragonlingEvolutionPolicy,SOURCE_DRAGONLING_EVOLUTION_CONTRACT} from '../scripts/era-bridge/roster8/dragonling-evolution-source.mjs';
const actual=JSON.parse(fs.readFileSync(new URL('../outputs/wog-priorities-0.4.147/native-dragonling-daily-evolution.json',import.meta.url))),hash=actual.report.dragonlingStage.definitionSha256;
test('all actual native evolution controls pass; missing controls fail closed',()=>{assert.equal(validateDragonlingEvolution(actual,hash),true);for(const key of EVOLUTION_NATIVE_CONTROLS){const changed=structuredClone(actual);delete changed.report[key];assert.throws(()=>validateDragonlingEvolution(changed,hash),key);}assert.throws(()=>validateDragonlingEvolution(actual,'0'.repeat(64)));});
test('owner reset, town evolution, lost banner and changed Emerald order are rejected',()=>{for(const mutate of [
 p=>{p.report.dragonlingOwningPlayerOnly.observed.totalExperience=0;},
 p=>{p.report.dragonlingTownArmyExcluded.townAfter.armies.find(a=>a.id===p.report.dragonlingTownArmyExcluded.before.towns[0].id).slots[1].key='core:rustDragon';},
 p=>{p.report.dragonlingDailyThresholdCountBanner.after.troopEquipment.troops.find(t=>t.slot===2).equipped.id=-1;},
 p=>{p.report.dragonlingEmeraldBeforeEvolution.after.armies[0].slots[0].key='core:fairieDragon';}
 ]){const changed=structuredClone(actual);mutate(changed);assert.throws(()=>validateDragonlingEvolution(changed,hash));}});
test('production registration must be explicit for every source actor',()=>{const actorContracts=Object.fromEntries([341,342,343,344,345].map(id=>[id,{complete:true,nativeValidated:true,nativeId:'tum-era:eraCreature'+id,active:true}])),options={contract:SOURCE_DRAGONLING_EVOLUTION_CONTRACT,rebornEnabled:false,actorContracts};delete actorContracts[343].active;assert.throws(()=>sourceDragonlingEvolutionPolicy(options),/registered.*343/);assert.equal(sourceDragonlingEvolutionPolicy({...options,allowPrivateNativeReview:true}).pairs.length,5);});
