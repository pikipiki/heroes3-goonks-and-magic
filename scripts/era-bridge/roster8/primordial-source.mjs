/** Optional exact346/347 compiler; never grants native validation or activation. */
import assert from 'node:assert/strict';
import {compileCreatureProperties,parseCreatureProperties} from '../creatures/creature-properties.mjs';
import {compileCreatureExperience} from '../creatures/crexpbon.mjs';
import {compileFreshSourceExperienceDefaults,adaptSourceOwnHealthExperience,SOURCE_EXPERIENCE_DEFAULTS_CONTRACT} from '../creatures/source-experience-defaults.mjs';
export const SOURCE_PRIMORDIAL_CONTRACT='source-primordial-dragons-v1';
const ranks=step=>Array.from({length:11},(_,i)=>i*step);
export function reviewedPrimordialFields(text,{sourceId,contract}={}){
 assert.equal(contract,SOURCE_PRIMORDIAL_CONTRACT);assert([346,347].includes(sourceId));
 const entries=parseCreatureProperties(text),actual=Object.fromEntries(entries.map(e=>[e.key,Number(e.rawValue)]));assert.equal(entries.length,Object.keys(actual).length,'Duplicate source CFG key');
 const common={DoNotGenerate:1,AfterActionSpellMastery:3,Level:6,'Resistance effect':4,'Spell 1':10,'Spell 2':7,'Spell 3':2,Fear:1,Fearless:1,Sktransformer:254};
 const own=sourceId===346?{AfterMeleeSpell:22,AfterDefendSpell:29,AfterMeleeSpell2:22,AfterDefendSpell2:29,Flags:-2147467109,CreatureSpellPowerMultiplier:5,CreatureSpellPowerAdder:60,CastsSpell:22,hasFirewall:1,'Fire shield':.3}:{AfterMeleeSpell:20,AfterDefendSpell:20,AfterMeleeSpell2:16,AfterDefendSpell2:20,Flags:-2013265765,CreatureSpellPowerMultiplier:10,CreatureSpellPowerAdder:90,CastsSpell:16,MovesTwice:1};
 assert.deepEqual(actual,{...common,...own},'Whole exact source CFG required');return actual;
}
export function reviewedPrimordialExperience(rows,{sourceId,contract}={}){
 assert.equal(contract,SOURCE_PRIMORDIAL_CONTRACT);assert([346,347].includes(sourceId));const selected=rows.filter(r=>r.creature===sourceId);
 const expected=[['H','%',ranks(10)],...['A','D','M','m'].map(c=>[c,'+',ranks(2)]),['w','5',Array(11).fill(1)],['p',sourceId===346?'#21':'#16',ranks(10)],['a',sourceId===346?'#13':'#20',ranks(10)]];
 assert.deepEqual(selected.map(r=>[r.code,r.modifier,r.values]),expected,'Whole exact XP row order/values required');return selected;
}
export function compilePrimordial({cfg,sourceId,contract,rows,installedRows,fearBonus,resolveCreature}={}){
 const fields=reviewedPrimordialFields(cfg,{sourceId,contract}),own=reviewedPrimordialExperience(rows,{sourceId,contract});
 assert.equal(fearBonus?.type,'FEARFUL');assert.equal(fearBonus?.stacking,'eraSourceFear:219:v1');
 const base=compileCreatureProperties('Flags='+(fields.Flags&~(1<<27))+'\nLevel=6\nFearless=1\n',{freshDefinition:true,analyseOnly:true,nativeBiologyContract:'source-biological-flags-v1'});assert.deepEqual(base.policies,[]);
 // File-order p/a are a dedicated source pipeline, not generic VCMI bonuses.
 const staticRows=rows.filter(r=>r.creature!==sourceId||!['p','a'].includes(r.code));
 const xp=compileCreatureExperience(staticRows,{creatureId:sourceId,installedRows,rankZero:'intrinsic',nativeExperienceProfile:true,negativeSpellLevels:'source-w-level-v1',throwOnError:true});assert.equal(xp.ok,true);
 const health=adaptSourceOwnHealthExperience(xp.definition.stackExperience,own,'source-health-xp-rounding-v1');
 const defaults=compileFreshSourceExperienceDefaults(rows,{creatureId:sourceId,sourceLevelZeroBased:6,installedRows,nativeExperienceProfile:true,contract:SOURCE_EXPERIENCE_DEFAULTS_CONTRACT,freshDefinition:true,nativeDefaultCarrier:'creature-json',healthRoundingContract:'source-health-xp-rounding-v1'});assert.equal(defaults.ok,true);assert.equal(defaults.sourceDefaultsReplacedByOwn.length,5);assert.equal(defaults.definition.stackExperience.length,0);
 const target=resolveCreature?.(254);assert.equal(target,'tum-era:necrossDragon');
 const abilities={...base.definition.abilities,...xp.definition.abilities,sourceFear:{...structuredClone(fearBonus),stacking:'eraSourceFear:'+sourceId+':v1'},sourceActiveCaster:{type:'SPELLCASTER',subtype:sourceId===346?'core:inferno':'core:iceBolt',val:2},sourceActiveSpellPower:{type:'CREATURE_SPELL_POWER',val:100},sourceInitialCasts:{type:'CASTS',val:10},sourceSkeletonTarget:{type:'SKELETON_TRANSFORMER_TARGET',subtype:target}};
 if(sourceId===346)abilities.sourceIntrinsicShield={type:'FIRE_SHIELD',val:30};
 return{definition:{...base.definition,special:true,level:7,faction:'core:neutral',hasDoubleWeek:false,abilities,stackExperience:health.stackExperience},defaults:{contract:defaults.contract,replacedByOwn:defaults.sourceDefaultsReplacedByOwn,rows:defaults.sourceDefaultRows},runtime:{allSpellImmunity:{}},skeleton:{target,living:true},sourceId,contract,sourceFields:fields,sourceExperience:own,sourceRuntimeRows:own.filter(r=>['p','a'].includes(r.code)).map(r=>({sourceCode:r.code,spell:Number(r.modifier.slice(1)),rankChances:r.values,mastery:3,kind:1,phase:r.code==='p'?'before primary hit':'after hit before FireShield',sourceLine:r.line})),nativeValidated:false,activation:false,pending:['Native original nature/flags/stats/charges and R0/4/5/10 stat/profile replacement controls','Active and double direct-cast current-power/context/source ordered RNG native controls','346 intrinsic0.3shield override +queuedFirewall13/XPafter13 tests','347 cache/morale/Wait/Defend/save/load/slot-reuse tests','Fear, global source283/346347 immunity and cleanup, skeleton254 native control']};
}
