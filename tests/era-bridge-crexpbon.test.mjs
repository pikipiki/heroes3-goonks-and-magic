import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseCreatureExperience,compileCreatureExperience,assertDefaultParity} from '../scripts/era-bridge/creatures/crexpbon.mjs';
const row=(id,code,mod,values,comment='')=>[id,code,mod,...values,comment].join('\t'),zero=Array(11).fill(0),defaults=parseCreatureExperience(row(-8,'H','%',[0,5,10,15,20,25,30,35,40,45,50])),resolvers={resolveSpell:id=>`core:spell${id}`,resolveCreature:id=>`tum-era:eraCreature${id}`};
function compile(r,extra={}){return compileCreatureExperience([...defaults,...r],{creatureId:287,installedRows:defaults,...resolvers,...extra});}
test('strict table parser validates all eleven ranks and tolerates legacy field whitespace',()=>{
 const r=parseCreatureExperience(row(287,'S','+',[0,0,0,0,1,'1 ',1,1,1,1,1]));assert.equal(r[0].values.length,11);assert.equal(r[0].values[5],1);assert.throws(()=>parseCreatureExperience('287\tS\t+\t0'),/malformed-row/);assert.throws(()=>parseCreatureExperience(row(287,'S','+',zero).replace(/\t0\t/,'\tNaN\t')),/malformed-row/);
});
test('unknown codes, unsupported modifiers, unresolved identifiers never yield partial definitions',()=>{
 for(const [code,mod]of [['Z','+'],['H','+'],['L','#125'],['U','#60'],['r','#50'],['w','1']]){const r=compile(parseCreatureExperience(row(287,code,mod,zero)));assert.equal(r.ok,false);assert.equal(r.definition,null);}
 assert.equal(compile(parseCreatureExperience(row(287,'p','#50',[0,1,1,1,1,1,1,1,1,1,1])),{resolveSpell:()=>null}).definition,null);
});
test('installed global/tier parity is mandatory and matching defaults are never duplicated',()=>{
 assert.equal(compile([], {installedRows:undefined}).ok,false);const changed=structuredClone(defaults);changed[0].values[10]=51;assert.throws(()=>assertDefaultParity(defaults,changed),/global-tier-defaults-mismatch/);const r=compile([]);assert.equal(r.defaults.rows,1);assert.deepEqual(r.definition,{abilities:{},stackExperience:[]});
});
test('source R0 preattack100 is explicit intrinsic, not lost as a rank baseline or imported as chance20',()=>{
 const rows=parseCreatureExperience(row(287,'p','#50',Array(11).fill(100)));assert.equal(compile(rows).ok,false);const r=compile(rows,{rankZero:'intrinsic'});assert.equal(r.ok,true);assert.deepEqual(r.definition.abilities.crexp_0_rank0,{type:'SPELL_BEFORE_ATTACK',subtype:'core:spell50',valueType:'ADDITIVE_VALUE',addInfo:3,val:100});assert.deepEqual(r.definition.stackExperience,[]);
});
test('numeric rank values are cumulative additions above intrinsic R0; native loader supplies differences',()=>{
 const values=[3,3,4,4,5,5,7,7,9,9,10],r=compile(parseCreatureExperience(row(287,'A','+',values)),{rankZero:'intrinsic'});assert.equal(r.definition.abilities.crexp_0_rank0.val,3);assert.deepEqual(r.definition.stackExperience[0].values,[0,1,1,2,2,4,4,6,6,7]);
 let last=0,total=3;for(let i=0;i<10;i++){const v=r.definition.stackExperience[0].values[i];total+=v-last;last=v;assert.equal(total,values[i+1]);}
});
test('toggle encoding uses first actual1, treats2 as off, rejects later disable',()=>{
 const r=compile(parseCreatureExperience(row(287,'f','R',[2,2,2,2,2,1,1,1,1,1,1])));assert.equal(r.definition.stackExperience[0].values.findIndex(Boolean)+1,5);assert.equal(r.definition.stackExperience[0].bonus.type,'BLOCKS_RETALIATION');assert.equal(compile(parseCreatureExperience(row(287,'f','R',[0,0,1,1,2,2,2,2,2,2,2]))).ok,false);
});
test('independent-max enchantment1->2->3->6 keeps absolute levels via boolean thresholds',()=>{
 const values=[0,1,1,2,2,2,3,3,3,6,6],r=compile(parseCreatureExperience(row(287,'s','#49',values)));assert.equal(r.ok,true);assert.equal(r.definition.stackExperience.length,4);for(let rank=1;rank<=10;rank++){const actual=Math.max(0,...r.definition.stackExperience.filter(e=>e.values[rank-1]).map(e=>e.bonus.val));assert.equal(actual,values[rank]);}assert.equal(r.definition.stackExperience.at(-1).bonus.val,6);assert.equal(r.definition.stackExperience.at(-1).values.findIndex(Boolean)+1,9);
});
test('real scoped source compilation closes287 and252 with29matching installed defaults',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/tum/experience-corpus.json',import.meta.url))),rows=parseCreatureExperience(fixture.source),installedRows=parseCreatureExperience(fixture.installed);
 const options={installedRows,rankZero:'intrinsic',...resolvers};
 const skipper=compileCreatureExperience(rows,{...options,creatureId:287}),phoenix=compileCreatureExperience(rows,{...options,creatureId:252});assert.equal(skipper.ok,true);assert.equal(phoenix.ok,true);assert.equal(skipper.defaults.rows,29);assert.equal(skipper.definition.abilities.crexp_0_rank0.val,100);
 const rebirth=phoenix.definition.stackExperience.find(e=>e.bonus.type==='REBIRTH');assert.equal(rebirth.values.findIndex(Boolean)+1,8);assert.equal(rebirth.bonus.val,20);assert.equal(rebirth.bonus.subtype,'rebirthRegular');assert(compileCreatureExperience(rows,{...options,creatureId:286}).diagnostics.some(d=>d.code==='periodic-summoning-requires-native-adapter'));
});
