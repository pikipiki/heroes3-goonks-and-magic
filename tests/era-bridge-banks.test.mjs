import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseTumBanks,compileTumBank,BankCompilationError} from '../scripts/era-bridge/banks.mjs';
const opts={source:'Lang/TUM_CreatureBanks.json',objectId:'pantheon',nativeTemplates:{base:{animation:'tum/bank.def',mask:['VVVV','BBBV','BABV','VVVV']}},guardsLayout:'creatureBankNarrow',resolveCreature:id=>({329:'tum:ghoul',324:'tum:guard'}[id]),resolveArtifact:id=>id===227?'tow:phylactery':undefined};
const state=(chance=100)=>({chance,guardians:{type:[329,329,329,329,329,329,-1],count:[30,30,30,30,30,30,0]},resources:[0,0,0,0,0,0,5000],creatureRewardType:-1,creatureRewardCount:0,artifactTypeCounts:[0,0,1,0]});
const bank=()=>({name:'Pantheon',density:100,enabled:true,value:1800,properties:['OPAQUE ORIGINAL OBJECT LINE'],states:[state()]});
const native=result=>result.definition['core:creatureBank'].types.pantheon;
const failure=(fn,code,pointer)=>assert.throws(fn,e=>e instanceof BankCompilationError&&e.diagnostics.some(d=>d.code===code&&(pointer===undefined||d.pointer===pointer)));
test('six original guardian stacks are retained separately, zero slots ignored, resources and artifact class translated',()=>{
 const input=bank(),before=structuredClone(input),result=compileTumBank(input,opts),b=native(result);
 assert.equal(b.rewards[0].guards.length,6);assert(b.rewards[0].guards.every(g=>g.type==='tum:ghoul'&&g.amount===30));assert.deepEqual(b.rewards[0].resources,{gold:5000});assert.deepEqual(b.rewards[0].artifacts,[{class:'MAJOR'}]);assert.deepEqual(b.rewards[0].appearChance,{min:0,max:100});assert.deepEqual(b.templates,opts.nativeTemplates);assert.equal(b.rmg,undefined);assert.deepEqual(result.report.sourceTemplateLines,input.properties);assert.deepEqual(input,before);
});
test('weighted states use one shared native dice with exact disjoint bounds',()=>{
 const input=bank();input.states=[state(25),state(75)];const result=compileTumBank(input,opts);assert.deepEqual(native(result).rewards.map(s=>s.appearChance),[{min:0,max:25},{min:25,max:100}]);
 input.states=[state(1),state(3)];failure(()=>compileTumBank(input,opts),'INVALID_WEIGHTS');assert.deepEqual(native(compileTumBank(input,{...opts,chanceMode:'relative'})).rewards.map(s=>s.appearChance),[{min:0,max:25},{min:25,max:100}]);
 input.states=[state(1),state(2)];failure(()=>compileTumBank(input,{...opts,chanceMode:'relative'}),'NONREPRESENTABLE_WEIGHTS');
});
test('all seven resource indices map in ERA order and unsupported nonzero extra resources fail',()=>{
 const input=bank();input.states[0].resources=[1,2,3,4,5,6,7];assert.deepEqual(native(compileTumBank(input,opts)).rewards[0].resources,{wood:1,mercury:2,ore:3,sulfur:4,crystal:5,gems:6,gold:7});
 input.states[0].resources.push(20);failure(()=>compileTumBank(input,opts),'MISSING_RESOLVER','/states/0/resources/7');
 assert.deepEqual(native(compileTumBank(input,{...opts,resolveResource:id=>id===7?'custom:mithril':undefined})).rewards[0].resources,[{type:'core:wood',amount:1},{type:'core:mercury',amount:2},{type:'core:ore',amount:3},{type:'core:sulfur',amount:4},{type:'core:crystal',amount:5},{type:'core:gems',amount:6},{type:'core:gold',amount:7},{type:'custom:mithril',amount:20}]);
});
test('specific artifacts and creature rewards must resolve before any bank can be emitted',()=>{
 const input=bank();Object.assign(input.states[0],{artifactIds:[227],creatureRewardType:324,creatureRewardCount:5});const b=native(compileTumBank(input,opts));assert.deepEqual(b.rewards[0].creatures,[{type:'tum:guard',amount:5}]);assert.deepEqual(b.rewards[0].artifacts,[{class:'MAJOR'},'tow:phylactery']);
 failure(()=>compileTumBank(input,{...opts,resolveArtifact:()=>undefined}),'UNRESOLVED_IDENTIFIER','/states/0/artifactIds/0');failure(()=>compileTumBank(input,{...opts,resolveCreature:()=>undefined}),'UNRESOLVED_IDENTIFIER');
});
test('unknown semantics, upgrade effects and no-op upgrade assumptions fail closed',()=>{
 for(const mutate of [b=>b.specialRewards=[],b=>b.states[0].morale=1,b=>b.states[0].specialRewards=[],b=>b.troopPlacement={isBank:true}]){const input=bank();mutate(input);failure(()=>compileTumBank(input,opts),'UNSUPPORTED_PROPERTY');}
 const input=bank();input.states[0].upgrade=0;failure(()=>compileTumBank(input,opts),'UNSUPPORTED_SEMANTICS','/states/0/upgrade');
 assert(compileTumBank(input,{...opts,disabledUpgradeEvidence:'plugin.cpp:90: zero disables upgrade'}).provenance.some(p=>p.pointer==='/states/0/upgrade'));
 input.states[0].upgrade=281;failure(()=>compileTumBank(input,{...opts,disabledUpgradeEvidence:'zero contract'}),'UNSUPPORTED_SEMANTICS','/states/0/upgrade');
});
test('native masks and layout are explicit requirements, never guessed from ERA template strings',()=>{
 failure(()=>compileTumBank(bank(),{...opts,nativeTemplates:undefined}),'MISSING_NATIVE_TEMPLATES');failure(()=>compileTumBank(bank(),{...opts,guardsLayout:undefined}),'MISSING_GUARDS_LAYOUT');failure(()=>compileTumBank(bank(),{...opts,nativeTemplates:{base:{animation:'x',mask:['VA','B']}}}),'INVALID_TEMPLATE');
});
test('malformed slots, missing guardians, missing rewards and nonfinite quantities reject the whole object',()=>{
 let input=bank();input.states[0].guardians.count.pop();failure(()=>compileTumBank(input,opts),'INVALID_GUARD_SLOTS');
 input=bank();input.states[0].guardians.count.fill(0);failure(()=>compileTumBank(input,opts),'MISSING_GUARDIANS');
 input=bank();input.states[0].guardians.type[0]=-1;failure(()=>compileTumBank(input,opts),'UNRESOLVED_IDENTIFIER');
 input=bank();input.states[0].resources[6]=Infinity;failure(()=>compileTumBank(input,opts),'INVALID_INTEGER');
 input=bank();delete input.states[0].creatureRewardCount;failure(()=>compileTumBank(input,opts),'INVALID_INTEGER');
 input=bank();input.enabled=false;failure(()=>compileTumBank(input,opts),'DISABLED_SOURCE_BANK');
});
test('raw whole-document input preserves JSON pointer, line and column provenance',()=>{
 const text=JSON.stringify({RMG:{objectGeneration:{16:{33:bank()}}}},null,2),pointer='/RMG/objectGeneration/16/33',parsed=parseTumBanks(text,{source:'source.json'}),before=structuredClone(parsed),r=compileTumBank(parsed,{...opts,pointer});
 assert(r.provenance.every(p=>p.source==='source.json'&&p.line>0&&p.column>0));assert(r.provenance.some(p=>p.pointer===pointer+'/states/0/resources/6'));assert.deepEqual(parsed,before);
 const p=r.provenance.find(p=>p.pointer===pointer+'/name');assert(text.split('\n')[p.line-1].includes('Pantheon'));
 failure(()=>compileTumBank('{"name":"A","name":"B"}',opts),'DUPLICATE_PROPERTY','/name');failure(()=>compileTumBank('{oops}',opts),'INVALID_JSON');
});
test('provided native RMG policy is explicit and unknown policy fields still reject',()=>{
 const b=native(compileTumBank(bank(),{...opts,nativeRmg:{value:2000,rarity:50,zoneLimit:1}}));assert.deepEqual(b.rmg,{value:2000,rarity:50,zoneLimit:1});
 failure(()=>compileTumBank(bank(),{...opts,nativeRmg:{guessDensity:100}}),'UNSUPPORTED_PROPERTY');
});

test('script-created banks preserve source disabled RMG without enabling generation',()=>{
 const input=bank();input.enabled=false;
 const result=compileTumBank(input,{...opts,sourcePlacement:'scripted-object'});
 assert.equal(native(result).rmg,undefined);
 assert.equal(result.report.sourceRmgMetadata.enabled,false);
 assert.equal(result.report.sourcePlacement,'scripted-object');
 failure(()=>compileTumBank(input,{...opts,sourcePlacement:'scripted-object',nativeRmg:{value:100,density:1}}),'SCRIPTED_SOURCE_RMG');
 failure(()=>compileTumBank(input,{...opts,sourcePlacement:'strict'}),'DISABLED_SOURCE_BANK');
});
