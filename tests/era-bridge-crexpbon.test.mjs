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

test('source binary school immunities distinguish hostile upper-case from full lower-case school immunity',()=>{
 const rows=parseCreatureExperience('357\tw\tA\t0\t0\t0\t0\t0\t0\t1\t1\t1\t1\t1\n357\tw\ta\t0\t0\t0\t0\t0\t0\t0\t1\t1\t1\t1');
 const c=compileCreatureExperience(rows,{creatureId:357,installedRows:[],rankZero:'intrinsic'});assert.equal(c.ok,true);
 assert.equal(c.mapped[0].bonus.type,'NEGATIVE_EFFECTS_IMMUNITY');assert.equal(c.mapped[0].bonus.subtype,'spellSchool.air');assert.equal(c.mapped[0].bonus.val,undefined);
 assert.equal(c.mapped[1].bonus.type,'SPELL_SCHOOL_IMMUNITY');assert.equal(c.mapped[1].bonus.subtype,'spellSchool.air');
});

test('source Dispel P switches off after R8, hostile p begins R9 and requires explicit native bindings',()=>{
 const rows=parseCreatureExperience('295\tw\tP\t0\t0\t0\t0\t0\t0\t0\t1\t1\t0\t0\n295\tw\tp\t0\t0\t0\t0\t0\t0\t0\t0\t0\t1\t1');
 assert.equal(compileCreatureExperience(rows,{creatureId:295,installedRows:[],rankZero:'intrinsic'}).ok,false);
 const c=compileCreatureExperience(rows,{creatureId:295,installedRows:[],rankZero:'intrinsic',nativeExperienceProfile:true,dispelProtection:'native-era-v1'});assert.equal(c.ok,true);
 assert.equal(c.definition.stackExperience[0].bonus.type,'ERA_DISPEL_IMMUNITY');assert.equal(c.definition.stackExperience[0].bonus.val,1);
 assert.deepEqual(c.definition.stackExperience[0].values,[false,false,false,false,false,false,true,true,false,false]);
 assert.equal(c.definition.stackExperience[1].bonus.val,2);assert.deepEqual(c.definition.stackExperience[1].values,[false,false,false,false,false,false,false,false,true,true]);
});

test('attack spell codes beyond the proven p50 service fail closed instead of inventing mastery or target rules',()=>{
 for(const code of ['a','c','K','k','J','j'])assert.equal(compile(parseCreatureExperience(row(287,code,'#50',[0,5,10,15,20,25,30,35,40,45,50])),{rankZero:'intrinsic'}).ok,false);
 assert.equal(compile(parseCreatureExperience(row(287,'p','#49',[0,5,10,15,20,25,30,35,40,45,50])),{rankZero:'intrinsic'}).ok,false);
 const c=compile(parseCreatureExperience(row(287,'p','#50',[0,5,10,15,20,25,30,35,40,45,50])),{rankZero:'intrinsic'});assert.equal(c.ok,true);assert.equal(c.requirements.experiencePreAttackSpellPolicy,'source-p50-v1');
});

test('Source unicorn experience aura grants twenty percent without summing repeated auras',()=>{
 const c=compile(parseCreatureExperience(row(287,'f','u',[0,0,0,0,0,0,1,1,1,1,1])));
 assert.equal(c.ok,true);
 assert.deepEqual(c.mapped[0].bonus,{type:'SPELL_RESISTANCE_AURA',val:20,valueType:'INDEPENDENT_MAX'});
 assert.equal(c.definition.stackExperience[0].values.findIndex(Boolean)+1,6);
});

test('harmful spell-level immunity requires the audited adapter, preserves rank3 and never becomes general immunity',()=>{
 const rows=parseCreatureExperience(row(287,'w','1',[0,0,0,1,1,1,1,1,1,1,1]));
 for(const options of [{},{nativeExperienceProfile:true},{negativeSpellLevels:'source-w-level-v1'}])assert.equal(compile(rows,options).ok,false);
 const result=compile(rows,{nativeExperienceProfile:true,negativeSpellLevels:'source-w-level-v1'});
 assert.equal(result.ok,true);assert.deepEqual(result.definition.stackExperience,[{bonus:{type:'ERA_NEGATIVE_SPELL_LEVEL_IMMUNITY',val:1,valueType:'INDEPENDENT_MAX'},values:[false,false,true,true,true,true,true,true,true,true]}]);
 const general=compile(parseCreatureExperience(row(287,'w','6',[0,0,0,1,1,1,1,1,1,1,1])));assert.equal(general.definition.stackExperience[0].bonus.type,'LEVEL_SPELL_IMMUNITY');
});

test('c75 requires exact Red224 source row and adapter, never shares the Poison or c78 contract',()=>{
 const rows=parseCreatureExperience(row(224,'c','#75',Array.from({length:11},(_,i)=>8*i))),base={creatureId:224,installedRows:[],nativeExperienceProfile:true,experienceStatusSelectors:'source-c75-v1',...resolvers};
 const good=compileCreatureExperience(rows,base);assert.equal(good.ok,true);assert.equal(good.runtimeBindings[0].selector,'era_compat_server::selectSourceCAge');assert.deepEqual(good.definition,{abilities:{},stackExperience:[]});
 for(const options of [{experienceStatusSelectors:'source-c78-v1'},{nativeExperienceProfile:false}])assert.equal(compileCreatureExperience(rows,{...base,...options}).ok,false);
 const wrong=structuredClone(rows);wrong[0].values[10]=79;assert.equal(compileCreatureExperience(wrong,base).ok,false);
});
