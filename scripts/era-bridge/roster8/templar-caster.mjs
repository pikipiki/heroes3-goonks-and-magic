/** Source modes8/10 and target mode7, restricted to the four original Templars.
 * Spell3 is the original AI evaluation selector; it is recorded separately from
 * native casting rules. Spell1 supplies mastery2; the5A0145 hook overrides both modes to current count.
 */
export const SOURCE_TEMPLAR_CASTER_CONTRACT='source-templar-caster-v1';
export const SOURCE_TEMPLAR_MORALE_CONTRACT='source-templar-positive-morale-v1';
export function compileSourceTemplarCaster(text,{sourceId,contract}={}){
 if(contract!==SOURCE_TEMPLAR_CASTER_CONTRACT)throw Error('Explicit source Templar caster contract required');
 const expected={269:[8,7,2,25],278:[10,7,4,25],331:[8,7,2,24],332:[10,7,4,24]}[sourceId];
 if(!expected)throw Error('Unreviewed Templar source actor');
 const keys=['Spell 1','Spell 2','Spell 3','CastsSpell'],values=keys.map(key=>{
  const matches=[...text.matchAll(new RegExp('^'+key+'\\s*=\\s*(\\d+)\\s*$','gm'))];
  if(matches.length!==1)throw Error('Exact source caster field required '+key);
  return Number(matches[0][1]);
 });
 if(values.some((v,i)=>v!==expected[i]))throw Error('Unreviewed source Templar casting modes');
 const spell=values[3]===25?'core:destroyUndead':'core:deathRipple',powerPerCreature=1;
 return {abilities:{sourceActiveCaster:{type:'SPELLCASTER',subtype:spell,val:2},sourceActiveSpellPower:{type:'CREATURE_SPELL_POWER',val:100*powerPerCreature}},
  sourceId,spell,mastery:2,powerPerCreature,sourceAiEvaluation:values[2],sourceTargetMode:values[1],
  scope:'Manual creature cast; native AI evaluates this same spell. Original AI scoring/RNG is not reimplemented.',
  evidence:['Amethyst tables.cpp spell_1_jumptable9102:mode8->44835E,mode10->Spell_1_mode_exact8109..8153',
   'h3era.exe44836D..448381 passes5*count, but unconditional Amethyst hook5A0145 overrides creature25/24 power to count*defaultMultiplier1/divider1+adder0; shippedDLL10015353..BC',
   'Amethyst tables.cpp Spell_1_mode_exact8128..8146:powerlivingCount,mastery2,Spells_Table',
   'Amethyst Spell_2_damage_spell9319..9415:targetmode7; mode10 checksAntimagic/CanCastSpellAtCoord',
   'Native CUnitState.getEffectPower:CREATURE_SPELL_POWER*currentCount/100']};
}

export function compileSourceTemplarMorale(text,{sourceId,contract}={}){
 if(contract!==SOURCE_TEMPLAR_MORALE_CONTRACT||![269,278].includes(sourceId))throw Error('Explicit original Templar morale contract required');
 if(!/^Flags=16\s*$/m.test(text)||!/^AlwaysPositiveMorale=1\s*$/m.test(text))throw Error('Unreviewed source positive morale actor flags');
 return {type:'MORALE',val:1,valueType:'INDEPENDENT_MAX'};
}
