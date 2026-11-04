import test from 'node:test';
import assert from 'node:assert/strict';
import {compileCreatureProperties} from '../scripts/era-bridge/creatures/creature-properties.mjs';
const options={freshDefinition:true,analyseOnly:true};
const compile=text=>compileCreatureProperties(text,options);
test('all level resistance selectors remain obligations, never level-only immunity shortcuts',()=>{for(const selector of [2,3,4,12,13]){const r=compile('Resistance effect='+selector);assert.equal(r.ready,false);assert.equal(r.policies.length,1);assert.equal(r.policies[0].kind,'era-resistance-selector');assert.equal(r.policies[0].parameters.legacyNativeShortcutRejected,true);assert(!Object.values(r.definition.abilities).some(x=>x.type==='LEVEL_SPELL_IMMUNITY'));}});
test('ALIVE absent cannot silently create a native living Gargoyle',()=>{const r=compile('Flags=131074');assert.equal(r.ready,false);assert.equal(r.policies[0].parameters.biology.sourceAlive,false);assert.equal(r.policies[0].parameters.biology.sourceUndead,false);assert.equal(r.policies[0].parameters.biology.nativeAutomaticLivingRequiresExplicitEquivalence,true);assert.throws(()=>compileCreatureProperties('Flags=131074',{...options,analyseOnly:false,sourceBinaryParity:true}),/UNBOUND_RUNTIME_POLICY/);});
