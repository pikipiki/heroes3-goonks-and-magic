import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('admitted magical actor285 enters the existing source damage ordering',()=>{
 const engine=fs.readFileSync('work/vcmi-wasm/lib/spells/CSpellHandler.cpp','utf8');
 assert.match(engine,/const bool sourceQuarter=isMagical\(\) && affectedCreature\s*&& era_compat::DwellingServices::get\(\).actor\(285,affectedCreature->creatureId\(\).toCreature\(\)->getJsonKey\(\)\);/);
 assert.match(engine,/if\(affectedCreature && \(sourceG \|\| orbChaos \|\| sourceCaster \|\| sourceQuarter\)\)/);
 const sourceBranch=engine.slice(engine.indexOf('if(affectedCreature && (sourceG'),engine.indexOf('//affected creature-specific part'));
 assert(sourceBranch.indexOf('caster->getSpellBonus')<sourceBranch.indexOf('const auto intrinsic='));
 assert(sourceBranch.indexOf('const auto intrinsic=')<sourceBranch.indexOf('forEachSchool'));
 const definition=JSON.parse(fs.readFileSync('mod/tum-era/content/config/source-dwelling-actors.json','utf8'));
 assert.deepEqual(definition.eraCreature285.abilities.sourceQuarterSpellDamage,{type:'SPELL_DAMAGE_REDUCTION',subtype:'spellSchool.any',val:75});
});

test('source signed /4 is preserved by native75 percent reduction, before school truncation',()=>{
 // Original44B200 implements signed division toward zero. Its input is a
 // signed Win32 integer; multiplying by25 in the engine's int64 cannot overflow.
 for(const raw of[-2147483648,-2147483647,-35,-7,-3,-1,0,1,3,7,35,2147483647])
  assert.equal(Math.trunc(raw*25/100)||0,Math.trunc(raw/4)||0);
 const source=Math.trunc(Math.trunc(35/4)*70/100);
 const previous=Math.trunc(Math.trunc(35*70/100)/4);
 assert.equal(source,5);
 assert.equal(previous,6,'moving the quarter reduction after ProtectionAir changes actual damage');
});
