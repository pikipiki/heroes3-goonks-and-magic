import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAmethystCreature,compileAmethystCreature,AmethystCompilationError} from '../scripts/era-bridge/amethyst.mjs';
const failure = (fn, code, key) => assert.throws(fn, error => error instanceof AmethystCompilationError && error.diagnostics.some(d=>d.code===code&&(key===undefined||d.key===key)));

test('cfg parser preserves source/line and rejects duplicate definitions instead of choosing a winner',()=>{
 const parsed=parseAmethystCreature('\uFEFF; comment\r\nLevel=6\r\n\r\nLevel=5\r\n',{source:'Data/Creatures/224.cfg'});
 assert.equal(parsed.entries.length,2);assert.equal(parsed.entries[0].line,2);assert.equal(parsed.entries[1].rawValue,'5');assert.equal(parsed.diagnostics[0].line,4);assert.equal(parsed.diagnostics[0].source,'Data/Creatures/224.cfg');
 failure(()=>compileAmethystCreature(parsed),'DUPLICATE_PROPERTY','Level');
});
test('malformed syntax, nonfinite numbers, partial numbers and out-of-range values fail with locations',()=>{
 for(const value of ['Infinity','NaN','50hp','1e2','2.5','9007199254740993','-1'])failure(()=>compileAmethystCreature('RegenerationHitPoints='+value+'\nRegenerationChance=100',{source:'broken.cfg'}),value==='9007199254740993'||value==='-1'?'OUT_OF_RANGE':'INVALID_INTEGER','RegenerationHitPoints');
 failure(()=>compileAmethystCreature('Level=8'),'OUT_OF_RANGE','Level');
 failure(()=>compileAmethystCreature('Town=9'),'OUT_OF_RANGE','Town');
 failure(()=>compileAmethystCreature('StrikeAndReturn=2'),'OUT_OF_RANGE','StrikeAndReturn');
 failure(()=>compileAmethystCreature('Level\nTown='),'MALFORMED_PROPERTY');
});
test('unconditional regeneration emits a native bonus and provenance for both source keys',()=>{
 const parsed=parseAmethystCreature('RegenerationHitPoints=50\nRegenerationChance=100',{source:'224.cfg'}),original=structuredClone(parsed);
 const result=compileAmethystCreature(parsed);
 assert.deepEqual(result.definition,{abilities:{amethystRegeneration:{type:'HP_REGENERATION',val:50}}});
 assert.deepEqual(result.provenance.map(p=>p.key),['RegenerationHitPoints','RegenerationChance']);
 assert(result.provenance.every(p=>p.contract==='amethyst.native-v1'&&p.evidence.length&&p.source==='224.cfg'));
 assert.deepEqual(parsed,original);
});
test('probabilistic and incomplete regeneration cannot silently turn into unconditional healing',()=>{
 failure(()=>compileAmethystCreature('RegenerationHitPoints=50\nRegenerationChance=50'),'UNSUPPORTED_SEMANTICS','RegenerationChance');
 failure(()=>compileAmethystCreature('RegenerationHitPoints=50'),'INCOMPLETE_REGENERATION','RegenerationHitPoints');
 failure(()=>compileAmethystCreature('RegenerationChance=100'),'INCOMPLETE_REGENERATION','RegenerationChance');
});
test('ERA faction and hated creature references require explicit resolvers',()=>{
 failure(()=>compileAmethystCreature('Town=4'),'MISSING_RESOLVER','Town');
 failure(()=>compileAmethystCreature('Hate0054=200'),'MISSING_RESOLVER','Hate0054');
 failure(()=>compileAmethystCreature('Town=4',{resolveTown:()=>undefined}),'UNRESOLVED_IDENTIFIER','Town');
 const result=compileAmethystCreature('Level=6\nTown=4\nHate0054=200\nStrikeAndReturn=1',{
  resolveTown:id=>id===4?'core:necropolis':undefined,resolveCreature:id=>id===54?'core:devil':undefined,
 });
 assert.equal(result.definition.level,7);assert.equal(result.definition.faction,'core:necropolis');
 assert.deepEqual(result.definition.abilities.amethyst_Hate0054,{type:'HATE',subtype:'core:devil',val:200});
 assert.equal(result.definition.abilities.amethystStrikeAndReturn.type,'RETURN_AFTER_STRIKE');
 assert.equal(result.provenance.length,4);
});
test('undocumented flags, spell effect enums, aliases and rebirth semantics are rejected',()=>{
 for(const key of ['Flags','Spell effect','Attack effect','rebirth chance','rebirth fraction','rebirth sure','ReturnAfterStrike','HitPoints','Attack','Defence','MadeUp'])failure(()=>compileAmethystCreature(key+'=1'),'UNSUPPORTED_PROPERTY',key);
});
test('an evidence contract can emit a specific native mapping and records its proof',()=>{
 const contract={name:'verified.scalar.attack',evidence:['source/plugin.cpp:42'],keys:['Attack'],compile(ctx){ctx.emit({keys:['Attack'],operation:'native creature attack override',definition:{attack:ctx.integer('Attack',{min:0,max:2147483647})}});}};
 const result=compileAmethystCreature('Attack=30',{contracts:[contract]});assert.equal(result.definition.attack,30);assert.equal(result.provenance[0].contract,contract.name);assert.deepEqual(result.provenance[0].evidence,contract.evidence);
 failure(()=>compileAmethystCreature('Attack=-1',{contracts:[contract]}),'OUT_OF_RANGE','Attack');
});
test('the cfg224 age adapter reports unresolved ERA hook semantics instead of claiming parity',()=>{
 const contract={name:'tum224.age-proc',evidence:['Data/s/-1000 tum - Archer.erm:821-833'],keys:['Spell effect'],compile(ctx){ctx.reject('Spell effect','ERA return target 0x75de33 needs verified age probability and duration');}};
 failure(()=>compileAmethystCreature('Spell effect=4\nRegenerationHitPoints=50\nRegenerationChance=100',{contracts:[contract]}),'UNSUPPORTED_SEMANTICS','Spell effect');
});
test('unnamed, evidence-free, overlapping, unclaimed and no-op adapters cannot bypass the gate',()=>{
 const base={name:'proof',evidence:['plugin.cpp:1'],keys:['Flags'],compile(){}};
 failure(()=>compileAmethystCreature('Flags=1',{contracts:[{...base,name:''}]}),'INVALID_EVIDENCE_CONTRACT');
 failure(()=>compileAmethystCreature('Flags=1',{contracts:[{...base,evidence:[]}]}),'INVALID_EVIDENCE_CONTRACT');
 failure(()=>compileAmethystCreature('Flags=1',{contracts:[base]}),'UNSUPPORTED_PROPERTY','Flags');
 failure(()=>compileAmethystCreature('Flags=1',{contracts:[{...base,compile(ctx){ctx.emit({keys:['Flags'],operation:'ignore',definition:{}});}}]}),'ADAPTER_FAILED','Flags');
 failure(()=>compileAmethystCreature('Flags=1',{contracts:[{...base,compile(ctx){ctx.emit({keys:['Other'],operation:'fake',definition:{attack:1}});}}]}),'ADAPTER_FAILED','Flags');
 failure(()=>compileAmethystCreature('Level=6',{contracts:[{...base,keys:['Level']}]}),'OVERLAPPING_CONTRACT','Level');
});
test('parsed input is revalidated so callers cannot erase a numeric diagnostic',()=>{
 const parsed=parseAmethystCreature('Level=bogus');parsed.diagnostics=[];failure(()=>compileAmethystCreature(parsed),'INVALID_INTEGER','Level');
});
test('adapters cannot emit non-JSON values or asynchronously mutate a compiled definition',()=>{
 for(const bad of [undefined,NaN,Infinity,1n])failure(()=>compileAmethystCreature('Attack=1',{contracts:[{name:'bad-value',keys:['Attack'],evidence:['test:1'],compile(ctx){ctx.emit({keys:['Attack'],operation:'override',definition:{attack:bad}});}}]}),'ADAPTER_FAILED','Attack');
 failure(()=>compileAmethystCreature('Attack=1',{contracts:[{name:'async',keys:['Attack'],evidence:['test:2'],async compile(ctx){await Promise.resolve();ctx.emit({keys:['Attack'],operation:'override',definition:{attack:1}});}}]}),'ADAPTER_FAILED','Attack');
});
