import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{sourceDemonologyCaster,sourceDemonologySpell,SOURCE_DEMONOLOGY_CONTRACT}from'../scripts/era-bridge/roster8/demonology-source.mjs';
import{parseJsonc}from'../scripts/era-bridge/artifacts/importer.mjs';
test('source mode2 preserves target49/217 and one50HP-per-current-creature cast, without claiming XP closure',{skip:!process.env.TUM_SOURCE},()=>{
 const original=parseJsonc(fs.readFileSync('work/vcmi-wasm/config/spells/vcmiAbility.json','utf8')).summonDemons;
 for(const sourceId of[217,338]){const caster=sourceDemonologyCaster(fs.readFileSync(`${process.env.TUM_SOURCE}/Data/Creatures/${sourceId}.cfg`,'utf8'),{sourceId,contract:SOURCE_DEMONOLOGY_CONTRACT});assert.equal(caster.complete,false);assert.equal(caster.sourceCasts,1);assert.equal(caster.abilities.sourceDemonPower.val,50);const spell=sourceDemonologySpell(original,caster);assert.equal(spell.levels.base.battleEffects.demonSummon.eraDemonology,true);assert.equal(spell.levels.base.battleEffects.demonSummon.id,caster.target);assert.equal(spell.levels.base.battleEffects.demonSummon.permanent,true);assert.deepEqual(spell.targetCondition,{});}
 assert.equal(original.levels.base.battleEffects.demonSummon.eraDemonology,undefined);
});
