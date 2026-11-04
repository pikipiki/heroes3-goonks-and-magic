import test from 'node:test';
import assert from 'node:assert/strict';
import {compileArtifact,parseArtifactCfg,COMBINATIONS} from '../scripts/era-bridge/artifacts/artifacts.mjs';
import * as r from '../scripts/era-bridge/artifacts/runtime.mjs';
const resolvers={resolveSpell:id=>`spell${id}`,resolveCreature:id=>`creature${id}`,resolveArtifact:id=>`artifact${id}`};
test('signed stats use correct native subtype and damage min/max separate',()=>{
 const c=compileArtifact({id:99,text:'Attack=16\nDefence=-5\nSpellpower=14\nKnowledge=-4\nMorale=-1\nDamageMin=2\nDamageMax=5',...resolvers});
 assert.equal(c.ok,true);assert.equal(c.patch.bonuses.Defence.val,-5);assert.equal(c.patch.bonuses.Spellpower.subtype,'primarySkill.spellpower');assert.equal(c.patch.bonuses.DamageMin.subtype,'creatureDamageMin');assert.equal(c.patch.bonuses.DamageMax.subtype,'creatureDamageMax');
});
test('opening spell explicitly preserves expert/50 turn native semantics',()=>{
 const c=compileArtifact({id:99,text:'Autospell=53\nAutospell2=43',...resolvers});
 assert.deepEqual(c.patch.bonuses.Autospell,{type:'OPENING_BATTLE_SPELL',val:50,subtype:'spell53',addInfo:[3,0]});
});
test('unknown/malformed/duplicate input and missing ids cannot emit partial patch',()=>{
 for(const text of ['Health=NaN','Health=1.1','Unknown=9','Shots=1\nShots=2','Immunities=1,no','Attack=2147483648'])assert.equal(compileArtifact({id:99,text}).patch,null);
 assert.equal(compileArtifact({id:99,text:'GivesSpell=17'}).patch,null);
});
test('Emerald first-match semantics retain warnings and do not invent second lightning spell/immunity',()=>{
 const c=compileArtifact({id:220,text:'GivesSpell=19\nGivesSpell=17\nImmunities=19\nImmunities=17',duplicates:'emerald-first',includeSpecials:false,...resolvers});
 assert.equal(c.ok,true);assert.equal(c.diagnostics.length,2);assert.equal(c.patch.bonuses.GivesSpell.subtype,'spell19');assert.equal(c.patch.bonuses.immunity17,undefined);
});
test('spell set boundaries preserve original 70 records and single-spell precedence',()=>{
 const c=compileArtifact({id:99,text:'GivesSpellSet=13',...resolvers});assert.equal(Object.keys(c.patch.bonuses).length,70);assert.equal(c.patch.bonuses.givenSpell70,undefined);
 const d=compileArtifact({id:99,text:'GivesSpellSet=9',...resolvers,spellCatalogue:[{id:5,level:1},{id:70,level:1},{id:6,level:2}]});assert.deepEqual(Object.keys(d.patch.bonuses),['givenSpell5']);
 const e=compileArtifact({id:99,text:'GivesSpellSet=13\nGivesSpell=17',...resolvers});assert.equal(Object.keys(e.patch.bonuses).length,1);
});
test('daily conversions are never emitted as optional paid SPECIAL_UPGRADE',()=>{
 const c=compileArtifact({id:99,text:'UpgradeFrom=2\nUpgradeTo=198\nShots=10',...resolvers});assert.equal(c.ok,false);assert.equal(c.patch,null);assert.equal(c.adapters[0].cost,0);
 const d=compileArtifact({id:99,text:'UpgradeFrom=2\nUpgradeTo=198',...resolvers,authorizeAdapters:['artifactDailyConversions']});assert.equal(d.ok,true);assert.deepEqual(d.patch.bonuses,{});
 assert.deepEqual(r.dailyConversions([{creature:'A',count:8}],[{upgrades:[{from:'A',to:'B'},{from:'B',to:'C'}]}]),[{creature:'C',count:8}]);
});
test('combination 278 exactly matches source excluding 275, no guessed faerie eye',()=>{
 assert.deepEqual(COMBINATIONS[278],[273,274,276,277]);const c=compileArtifact({id:278,...resolvers});assert.deepEqual(c.patch.components,['artifact273','artifact274','artifact276','artifact277']);
});
test('special artifact cannot emit an apparently complete artifact while event hook unbound',()=>{
 const c=compileArtifact({id:238,text:'Autospell=30',...resolvers});assert.equal(c.patch,null);assert.equal(c.nativePreview.bonuses.Autospell.val,50);assert(c.diagnostics.some(d=>d.kind==='orbChaos'));
});
test('summon fixed, scaled, zero powers and chains match integer ERA arithmetic',()=>{
 assert.equal(r.summonPower(-1300,7),9);assert.equal(r.summonPower(-500,1),1);assert.equal(r.summonPower(0,0),1);assert.equal(r.summonPower(12,3),12);
 const c=compileArtifact({id:99,text:'Autosummon=286\nAutosummonPower=-1300',...resolvers});assert.equal(c.adapters[0].summons[0].power,-1300);assert.equal(c.patch,null);
});
test('Horn counts, eligibility, surviving gain and army capacity',()=>{
 const base={originalCount:13,currentCount:0,targetHp:20,fangarmHp:50,living:true,sideStackCount:20};assert.equal(r.fangarmCount(base),5);assert.equal(r.fangarmCount({...base,targetHp:100}),6);assert.equal(r.fangarmCount({...base,sideStackCount:21}),0);assert.equal(r.fangarmCount({...base,living:false}),0);
 assert.equal(r.survivingFangarmGain([{isFangarm:true,count:5,originalCount:2},{isFangarm:true,count:1,originalCount:5}]),3);
 assert.equal(r.fangarmArmySlot([{creature:'x'},null,{creature:'f',isFangarm:true}]),2);
});
test('equalizer unwinds only stored adjustment and permits later stat changes',()=>{
 assert.deepEqual(r.equipEqualizer(5,11),{first:11,second:11,storedDifference:6});assert.deepEqual(r.unequipEqualizer(13,15,6),{first:7,second:15});assert.deepEqual(r.unequipEqualizer(14,14,-3),{first:14,second:11});
});
test('mass casting skips primary/dead/ineligible stacks and clamps integer 30% power',()=>{
 const stacks=[{id:1,side:0,creatureId:2,count:3,canReceiveSpell:true},{id:2,side:0,creatureId:2,count:3,canReceiveSpell:true},{id:3,side:0,creatureId:2,count:0,canReceiveSpell:true},{id:4,side:1,creatureId:2,count:3,canReceiveSpell:true}];
 const p=r.massSpellPlan({spell:'resurrection',artifactEquipped:true,heroPower:9,schoolLevel:2,actingSide:0,mainTarget:1,stacks});assert.equal(p.length,1);assert.equal(p[0].stackId,2);assert.equal(p[0].power,2);assert.equal(p[0].schoolLevel,2);
});
test('lightning rod keeps artifact immunities while suppressing natural resistance',()=>{
 assert.equal(r.lightningResistance({spell:'chainLightning',sameSide:true,ownRod:true,eitherRod:true,current:0}),100);assert.equal(r.lightningResistance({spell:'lightningBolt',artifactImmune:true,eitherRod:true,current:100}),100);assert.equal(r.lightningResistance({spell:'lightningBolt',eitherRod:true,current:100}),0);
});
test('source script arithmetic and source bugs are not silently improved',()=>{
 assert.equal(r.orbChaosDamage(3),4);assert.equal(r.interferencePower({heroPower:13,charm:true,seal:true,plate:true}),7);assert.equal(r.goldenGooseIncome({owned:2,equipped:1}),7000);assert.equal(r.reflectionResistance(95,true),100);
 assert.deepEqual(r.wayfarerPolicy({human:false,equipped:true}),{dailyMovement:400,currentMovement:400});assert.equal(r.hydraQueenEligible({lifeDrain:true}),false);
 assert.deepEqual(r.dragonheartCandidates([{id:'A',eraId:340,isDragon:true},{id:'B',eraId:341,isDragon:true},{id:'C',eraId:347,isDragon:true},{id:'D',eraId:348,isDragon:true}]),['A','D']);
});
test('full generator resolves caller assets and rejects incomplete metadata/collisions',async()=>{
 const {compileArtifactDefinition}=await import('../scripts/era-bridge/artifacts/artifacts.mjs');
 const baseArtifact={type:['HERO'],class:'MINOR',value:1000,slot:'RIGHT_HAND',text:{name:'Caller text',description:'Caller description',event:'Caller event'}};
 const c=compileArtifactDefinition({id:175,text:'Attack=7',baseArtifact,resolveAssets:()=>({image:'caller/icon.png',map:'caller/map.def',scenarioBonus:'caller/large.png'})});assert.equal(c.ok,true);assert.equal(c.definition.bonuses.Attack.val,7);assert.equal(c.definition.graphics.map,'caller/map.def');
 assert.equal(compileArtifactDefinition({id:175,text:'Attack=7',baseArtifact}).definition,null);
 assert.equal(compileArtifactDefinition({id:175,text:'Attack=7',baseArtifact:{...baseArtifact,bonuses:{Attack:{type:'LUCK',val:1}}},resolveAssets:()=>c.definition.graphics}).definition,null);
});
test('power-sensitive offensive openings and Hypnotize fail closed pending explicit adapter',()=>{
 for(const eraSpell of [11,24,25,60]){
  const c=compileArtifact({id:99,text:`Autospell=${eraSpell}`,...resolvers});assert.equal(c.patch,null);assert.deepEqual(c.nativePreview.bonuses,{});assert.equal(c.adapters[0].kind,'artifactFixedPowerOpeningSpell');assert.equal(c.adapters[0].sourceArgument,50);
 }
});

test('native-vcmi AI policy retains signed gameplay bonuses and explicit source-vector provenance',()=>{
 const input={id:171,text:'Attack=16\nDefence=-5\nMorale=-1\nAI_Properties="0 3 1 1 -1"'};
 assert.equal(compileArtifact(input).ok,false);
 const c=compileArtifact({...input,aiPolicy:'native-vcmi'});assert.equal(c.ok,true);assert.deepEqual(c.adapters,[]);
 assert.equal(c.patch.bonuses.Attack.val,16);assert.equal(c.patch.bonuses.Defence.val,-5);assert.equal(c.patch.bonuses.Morale.val,-1);
 assert.deepEqual(c.aiDecisions[0].eraTokens,[0,3,1,1,-1]);assert.equal(c.aiDecisions[0].policy,'native-vcmi');
 assert.throws(()=>compileArtifact({...input,aiPolicy:'ignore'}),/Unknown artifact AI policy/);
});

test('audited global source openings use fixed power50; targeted openings remain blocked',()=>{
 for(const spell of [24,25]){
  const r=compileArtifact({id:99,text:'Autospell='+spell,...resolvers,fixedPowerOpeningSpellContract:'source-fixed50-global-v1'});
  assert(r.ok);assert.deepEqual(r.patch.bonuses.Autospell,{type:'ERA_FIXED_POWER_OPENING_SPELL',val:50,subtype:'spell'+spell,addInfo:[3,0]});assert.deepEqual(r.adapters,[]);
 }
 for(const spell of [11,60])assert(!compileArtifact({id:99,text:'Autospell='+spell,...resolvers,fixedPowerOpeningSpellContract:'source-fixed50-global-v1'}).ok);
 assert.throws(()=>compileArtifact({id:99,fixedPowerOpeningSpellContract:'approximate'}),/Unknown source/);
});

test('Emerald cfg source indices are explicit even when text keys are out of order',()=>{const r=compileArtifact({id:99,text:'Autospell9=43\nAutospell=53\nAutospell2=29',...resolvers});assert(r.ok);assert.deepEqual(r.patch.bonuses.Autospell9.addInfo,[3,8]);assert.deepEqual(r.patch.bonuses.Autospell.addInfo,[3,0]);assert.deepEqual(r.patch.bonuses.Autospell2.addInfo,[3,1]);});
