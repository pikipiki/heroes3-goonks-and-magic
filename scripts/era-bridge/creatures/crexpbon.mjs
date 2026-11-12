import{requireSourceDeathBlowBinding}from'./death-blow-contract.mjs';
/** Independent compiler for the representable legacy CREXPBON subset.
 * Native mapping reference: VCMI CCreatureHandler.cpp loadStackExp (1020-1339).
 * Rank zero is explicit, not dropped by the legacy native parser's FIXME.
 */
export class ExperienceCompileError extends Error {constructor(diagnostics){super(diagnostics.map(d=>`${d.source??'<table>'}:${d.line??0} ${d.code}`).join('\n'));this.diagnostics=diagnostics;}}
export function parseCreatureExperience(text,{source='crexpbon.txt'}={}){
 if(typeof text!=='string')throw new TypeError('Expected CREXPBON text');const rows=[],diagnostics=[];
 for(const [i,raw]of text.replace(/^\uFEFF/,'').split(/\r?\n/).entries()){
  if(!raw.trim()||/^\s*(;|#|\/\/)/.test(raw))continue;const c=raw.split('\t').map((v,i)=>i<14?v.trim():v);
  if(c[0]==='Mon'&&c[1]==='B'&&c[2]==='Mod')continue;
  if(c.length<14||!/^(-?[0-9]+)$/.test(c[0])||c[1].length!==1||!c[2]||!c.slice(3,14).every(v=>/^-?\d+$/.test(v))){diagnostics.push({source,line:i+1,code:'malformed-row'});continue;}
  const id=Number(c[0]),values=c.slice(3,14).map(Number);if(!Number.isSafeInteger(id)||id < -8||values.some(v=>!Number.isSafeInteger(v)||v< -2147483648||v>2147483647)){diagnostics.push({source,line:i+1,code:'integer-range'});continue;}
  rows.push({creature:id,code:c[1],modifier:c[2],values,comment:c.slice(14).join('\t'),source,line:i+1});
 }
 if(diagnostics.length)throw new ExperienceCompileError(diagnostics);return rows;
}
const additive={A:['PRIMARY_SKILL','primarySkill.attack'],D:['PRIMARY_SKILL','primarySkill.defence'],M:['CREATURE_DAMAGE','creatureDamageMax'],m:['CREATURE_DAMAGE','creatureDamageMin'],S:['STACKS_SPEED'],O:['SHOTS'],b:['ENEMY_DEFENCE_REDUCTION'],C:['CHANGES_SPELL_COST_FOR_ALLY'],d:['DEFENSIVE_STANCE'],e:['DOUBLE_DAMAGE_CHANCE'],F:['FEARFUL'],P:['CASTS'],R:['ADDITIONAL_RETALIATION'],W:['MAGIC_RESISTANCE']};
const toggles={A:'ATTACKS_ALL_ADJACENT',b:'RETURN_AFTER_STRIKE',B:'TWO_HEX_ATTACK_BREATH',f:'FEARFUL',F:'FLYING',M:'NO_MORALE',p:'MIND_IMMUNITY',P:'MIND_IMMUNITY',R:'BLOCKS_RETALIATION',s:'FREE_SHOOTING',u:'SPELL_RESISTANCE_AURA',U:'UNDEAD'};
const spellImmunity={B:62,H:60,I:18,K:59,M:23,N:78,R:26,S:54};
function rowMapping(row,{resolveSpell,resolveCreature,nativeExperienceProfile=false,dispelProtection,negativeSpellLevels,experienceAfterAttack,experienceStatusSelectors,experienceFortress,experienceDungeon,experienceBeforeAttack,experienceDefenseReduction,experienceCrystal,experienceWerewolf,experienceGolem,experienceSpring,experienceDemonology,experiencePrimalFaerie,experienceStronghold,deathBlowCRT}={}){
 const fail=(code,extra={})=>{throw new ExperienceCompileError([{source:row.source,line:row.line,code,legacyCode:row.code,modifier:row.modifier,...extra}]);};
 const resolved=(kind,n)=>{const value=(kind==='spell'?resolveSpell:resolveCreature)?.(n);if(typeof value!=='string'||!value.includes(':'))fail('unresolved-id',{kind,id:n});return value;};
 const numberMod=()=>{if(!/^#\d+$/.test(row.modifier))fail('unsupported-modifier');const n=Number(row.modifier.slice(1));if(!Number.isSafeInteger(n)||n>2147483647)fail('modifier-id-range');return n;};
 let bonus,mode='numeric',scale=1,additionalBonuses=[],additionalRuntimeBindings=[];
 if(row.code==='e'){
  if(!['+','='].includes(row.modifier)||row.values.some(v=>v<0||v>100))fail('source-deathblow-values-not-closed');
  let binding;try{binding=requireSourceDeathBlowBinding(deathBlowCRT,{sourceId:row.creature,kind:'xp',nativeExperienceProfile});}catch{fail('source-deathblow-crt-binding-required');}
  bonus={type:'DOUBLE_DAMAGE_CHANCE',valueType:'ADDITIVE_VALUE'};additionalRuntimeBindings.push({...binding,sourceCode:'e',rankChances:[...row.values]});
 }else if(row.code==='b'){
  if(experienceDefenseReduction!=='source-experience-defense-v1'||!nativeExperienceProfile)fail('source-experience-defense-adapter-required');
  if(![133,266,267,268,315,318].includes(row.creature)&&!(row.creature===354&&experienceFortress==='source-fortress-counterstrikes-v1'&&row.modifier==='='&&row.values.every((v,i)=>v===i*4)))fail('source-experience-defense-actor-not-admitted');
  if(!['+','='].includes(row.modifier)||row.values.some(v=>v<0||v>100))fail('source-experience-defense-values-not-closed');
  bonus={type:'ERA_EXPERIENCE_DEFENSE_REDUCTION',valueType:'ADDITIVE_VALUE'};
 }else if(additive[row.code]){
  if(!['+','='].includes(row.modifier))fail('unsupported-modifier');const[type,subtype]=additive[row.code];bonus={type,...(subtype?{subtype}:{}),valueType:'ADDITIVE_VALUE'};
 }else if(row.code==='H'){
  if(row.modifier!=='%')fail('unsupported-modifier');bonus={type:'STACK_HEALTH',valueType:'PERCENT_TO_BASE'};
 }else if(row.code==='g'){
  if(row.modifier!=='%')fail('unsupported-modifier');bonus={type:'SPELL_DAMAGE_REDUCTION',subtype:'spellSchool.any',valueType:'ADDITIVE_VALUE'};
 }else if(row.code==='f'){
  mode='toggle';if(row.modifier==='r')bonus={type:'REBIRTH',subtype:'rebirthRegular',val:20};
  else if(row.modifier==='D')bonus={type:'ADDITIONAL_ATTACK',val:1};
  else if(row.modifier==='c')bonus={type:'JOUSTING',val:5};
  else if(row.modifier==='m')bonus={type:'MORALE',val:1,valueType:'INDEPENDENT_MAX'};
  else if(row.modifier==='f')bonus={type:'FEARFUL',val:0,valueType:'INDEPENDENT_MIN'};
  else if(row.modifier==='u')bonus={type:'SPELL_RESISTANCE_AURA',val:20,valueType:'INDEPENDENT_MAX'};
  else if(toggles[row.modifier])bonus={type:toggles[row.modifier]};else fail('unsupported-modifier');
  if(row.values.some(v=>![0,1,2].includes(v)))fail('invalid-toggle');
 }else if(row.code==='i'||row.code==='o'){
  if(!['+','='].includes(row.modifier))fail('unsupported-modifier');mode='toggle';bonus={type:row.code==='i'?'NO_DISTANCE_PENALTY':'NO_WALL_PENALTY'};
 }else if(row.code==='w'){
  mode='toggle';if(spellImmunity[row.modifier]!==undefined)bonus={type:'SPELL_IMMUNITY',subtype:resolved('spell',spellImmunity[row.modifier])};
  else if(row.modifier==='m')bonus={type:'MIND_IMMUNITY'};
  else if(/^[1-5]$/.test(row.modifier)){if(negativeSpellLevels!=='source-w-level-v1'||nativeExperienceProfile!==true)fail('negative-spell-level-requires-native-profile-and-adapter');if(row.values.some(v=>![0,1,2].includes(v)))fail('invalid-toggle');bonus={type:'ERA_NEGATIVE_SPELL_LEVEL_IMMUNITY',val:Number(row.modifier),valueType:'INDEPENDENT_MAX'};}
  else if(row.modifier==='D'){
   // WoG71CEB5..71CEF1 is a finite list, NOT generic damage immunity:
   // excludes DeathRipple, DestroyUndead, TitanBolt, LandMine and FireWall.
   const spellIds=[15,17,19,23,18,21,26,22,16,20];
   const all=spellIds.map(id=>({type:'SPELL_IMMUNITY',subtype:resolved('spell',id)}));bonus=all[0];additionalBonuses=all.slice(1);
  }
  else if(['P','p'].includes(row.modifier)){if(dispelProtection!=='native-era-v1'||nativeExperienceProfile!==true)fail('dispel-protection-requires-native-profile-and-adapter');bonus={type:'ERA_DISPEL_IMMUNITY',val:row.modifier==='P'?1:2};}
  else if('AFWE'.includes(row.modifier))bonus={type:'NEGATIVE_EFFECTS_IMMUNITY',subtype:'spellSchool.'+({A:'air',F:'fire',W:'water',E:'earth'})[row.modifier]};
  else if('afwe'.includes(row.modifier))bonus={type:'SPELL_SCHOOL_IMMUNITY',subtype:'spellSchool.'+({a:'air',f:'fire',w:'water',e:'earth'})[row.modifier]};
  else if(/^[6789:]$/.test(row.modifier))bonus={type:'LEVEL_SPELL_IMMUNITY',val:row.modifier===':'?5:Number(row.modifier)-5};
  else if(row.modifier==='0')bonus={type:'RECEPTIVE'};
  else fail('unsupported-modifier');
  if(row.values.some(v=>![0,1,2].includes(v)))fail('invalid-toggle');
 }else if(row.code==='p'){
  const id=numberMod();
  if(id!==50){
   const zeus=id===57&&row.creature===212&&nativeExperienceProfile===true&&experienceBeforeAttack==='source-p57-v1'&&row.values.every((v,i)=>v===i);
   const templar=((id===25&&row.creature===278)||(id===24&&row.creature===332))&&nativeExperienceProfile===true&&experienceBeforeAttack==='source-p24-p25-v1'&&row.values.every((v,i)=>v===i*5);
   const spring=id===37&&row.creature===350&&nativeExperienceProfile===true&&experienceBeforeAttack==='source-p37-v1'&&row.values.every((v,i)=>v===i*5);
   if(!zeus&&!templar&&!spring)fail('source-attack-spell-requires-specific-native-contract');
  }
  bonus={type:'SPELL_BEFORE_ATTACK',subtype:resolved('spell',id),valueType:'ADDITIVE_VALUE',addInfo:3};
  if(row.values.some(v=>v<0||v>100))fail('chance-range');
 }else if(row.code==='a'||row.code==='K'){
  if(experienceAfterAttack!=='source-a62-K59-v1'||nativeExperienceProfile!==true)fail('source-attack-spell-requires-specific-native-contract');
  const id=numberMod();if(!((row.code==='a'&&id===62)||(row.code==='K'&&id===59)))fail('unproven-afterattack-spell-contract');
  bonus={type:'SPELL_AFTER_ATTACK',subtype:resolved('spell',id),valueType:'ADDITIVE_VALUE',addInfo:row.code==='a'?3:2};
  if(row.values.some(v=>v<0||v>100))fail('chance-range');
 }else if(row.code==='c'){
  if([351,352].includes(row.creature)&&experienceDungeon==='source-dungeon-eighth-v1'){
   if(!nativeExperienceProfile||row.modifier!=='#54'||row.values.some((v,i)=>v!==i*3))fail('unproven-Dungeon-slow-row');
   return {mode:'runtime',values:[...row.values],runtimeBinding:{contract:'source-dungeon-eighth-v1',creatureId:row.creature,operation:'queuedSlow',spell:resolved('spell',54),sourceCode:'c',sourceModifier:'#54',rankChances:[...row.values],endpoint:'EraPetrificationSequence::beforeAction/shared-target-EC',sourceReference:'h3era.exe71D7A9/75BBF0/468CD8/5A0145',timing:'selection-before-action; postsequence current-active-power flush'}};
  }
  if([353,354].includes(row.creature)&&experienceFortress==='source-fortress-counterstrikes-v1'){
   if(!nativeExperienceProfile||row.modifier!=='#71'||row.values.some((v,i)=>v!==(row.creature===354?Math.min(95,i*10):i*5)))fail('unproven-Fortress-poison-row');
   return {mode:'runtime',values:[...row.values],runtimeBinding:{contract:'source-fortress-counterstrikes-v1',creatureId:row.creature,operation:'queuedPoison',spell:resolved('spell',71),sourceCode:'c',sourceModifier:'#71',rankChances:[...row.values],endpoint:'EraPetrificationSequence::beforeAction/shared-target-EC',sourceReference:'h3era.exe71D7A9/75B4CA/75CAF8',timing:'selection-before-action; postsequence sharedEC flush'}};
  }
  if(row.creature===224&&row.modifier==='#75'){
   if(nativeExperienceProfile!==true||experienceStatusSelectors!=='source-c75-v1'||row.values.some((v,i)=>v!==i*8))fail('unproven-c75-row-or-native-contract');
   return {mode:'runtime',values:[...row.values],runtimeBinding:{contract:'source-c75-v1',creatureId:224,spell:resolved('spell',75),sourceCode:'c',sourceModifier:'#75',rankChances:[...row.values],endpoint:'EraPetrificationSequence::beforeAction/shared-target-EC',selector:'era_compat_server::selectSourceCAge',sourceReference:'h3era.exe 71D7A9/75C0AD/75CAF8',timing:'selection-before-action; postsequence sharedEC flush; innate Age may overwrite'}};
  }
  if(nativeExperienceProfile!==true||experienceStatusSelectors!=='source-c78-v1')fail('source-c78-requires-explicit-native-contract');
  if(row.creature!==231||numberMod()!==78||row.values.some((v,i)=>v!==i*5))fail('unproven-c78-row');
  return {mode:'runtime',values:[...row.values],runtimeBinding:{contract:'source-c78-v1',creatureId:231,spell:resolved('spell',78),sourceCode:'c',sourceModifier:'#78',rankChances:[...row.values],endpoint:'EraPetrificationSequence::beforeAction/shared-target-EC',selector:'era_compat_server::selectSourceCDispel',sourceReference:'h3era.exe 71D7A9/75B4CA/75CAF8',timing:'selection-before-action; postsequence sharedEC flush; intrinsic marker may overwrite'}};
 }else if(['k','J','j'].includes(row.code)){
  // WoG71D939 uses p/a expert3,J/K advanced2,j/k basic1. Its original
  // target resistance gate and spell-specific mass/target rules must be bound,
  // not approximated by the legacy native parser's default school/power.
  fail('source-attack-spell-requires-specific-native-contract');
 }else if(row.code==='h'){
  const target=numberMod();
  if(experienceStronghold==='source-stronghold-creature-spell-immunity-v1'&&[275,283].includes(row.creature)&&[274,282].includes(target)){
   if(!nativeExperienceProfile||row.values.some((v,i)=>v!==i*2))fail('source-stronghold-hate-row-changed');
   bonus={type:'HATE',addInfo:{contract:experienceStronghold,sourceCreatureId:target},valueType:'ADDITIVE_VALUE'};
  }else bonus={type:'HATE',subtype:resolved('creature',target),valueType:'ADDITIVE_VALUE'};
  scale=10;
 }else if(row.code==='s'){
  bonus={type:'ENCHANTED',subtype:resolved('spell',numberMod()),valueType:'INDEPENDENT_MAX'};mode='independent';
  if(row.values.some(v=>v<0||v>6))fail('enchantment-range');
 }else if(row.code==='r'){
  const crystal=experienceCrystal==='source-crystal-experience-v1'&&nativeExperienceProfile&&[267,268].includes(row.creature)&&row.modifier==='#100'&&row.values.every((v,i)=>v===i*9);
  const werewolf=experienceWerewolf==='source-werewolf-experience-v1'&&nativeExperienceProfile&&row.creature===273&&row.modifier==='#50'&&row.values.every((v,i)=>v===i*4);
  if(!crystal&&!werewolf)fail('regeneration-chance-requires-native-adapter');
  return {mode:'runtime',values:[...row.values],runtimeBinding:{contract:crystal?'source-crystal-experience-v1':'source-werewolf-experience-v1',creatureId:row.creature,operation:'experienceRegeneration',service:{chancePercent:crystal?100:50,values:[...row.values]},sourceReference:'h3era.exe71EAA6..71EBA6,75DECA..75DF13',timing:'first activation each round; draw1..100 even for certain chance'}};
 }else if(row.code==='B'){
  const primal=experiencePrimalFaerie==='source-primal-faerie-v1'&&row.creature===258;
  if(!((experienceCrystal==='source-crystal-experience-v1'&&row.creature===268)||primal)||!nativeExperienceProfile||row.modifier!=='='||row.values.some((v,i)=>v!==Math.min(25,i*5)))fail('source-physical-block-requires-specific-native-contract');
  return {mode:'runtime',values:[...row.values],runtimeBinding:{contract:primal?'source-primal-faerie-v1':'source-crystal-experience-v1',creatureId:row.creature,operation:'physicalBlock',service:{values:[...row.values]},sourceReference:'h3era.exe71C5A9..71C70F,766AA2..766AC8',timing:'physical hit before partial deflection; draw1..100 iff chance is nonzero; success cancels complete hit'}};
 }
 else if(row.code==='L'){
  const werewolf=experienceWerewolf==='source-werewolf-experience-v1'&&nativeExperienceProfile&&row.creature===273&&row.modifier==='#125'&&row.values.every((v,i)=>v===i*6);
  const golem=experienceGolem==='source-golem-experience-v1'&&nativeExperienceProfile&&[271,280].includes(row.creature)&&row.modifier==='#49'&&row.values.every((v,i)=>v===i*5);
  const spring=experienceSpring==='source-spring-spirit-v1'&&nativeExperienceProfile&&row.creature===350&&row.modifier==='#125'&&row.values.every((v,i)=>v===i*6);
  if(!werewolf&&!golem&&!spring)fail('random-damage-deflection-requires-native-adapter');
  return {mode:'runtime',values:[...row.values],runtimeBinding:{contract:spring?'source-spring-spirit-v1':werewolf?'source-werewolf-experience-v1':'source-golem-experience-v1',creatureId:row.creature,operation:'physicalDeflection',service:{modifier:golem?49:125,values:[...row.values]},sourceReference:'h3era.exe71C710..71C902',timing:!golem?'25%chance; reduce by6%/rank after full physical block':'5%chance/rank; reduce by50% after full physical block'}};
 }

 else if(row.code==='u'){
  const expected=[0,0,0,10,10,15,15,20,20,25,25];
  if(experienceDemonology!=='source-demonology-mode2-v1'||!nativeExperienceProfile||row.creature!==217||row.modifier!=='#48'||row.values.some((v,i)=>v!==expected[i]))fail('source-round2-summoning-contract-required');
  return {mode:'runtime',values:[...row.values],runtimeBinding:{contract:'source-demonology-mode2-v1',creatureId:217,operation:'sourceRoundTwoDemons',service:{values:[...row.values]},sourceReference:'h3era71DF45..71E3F5,463E61..68,469F64..9FA3',timing:'round2reset afterenchants; currentcount percentage rounded;3orderedforwardhexes;source20slots;unownedwithoutSUMMONflag'}};
 }
 else if(row.code==='U')fail('periodic-summoning-requires-native-adapter');
 else fail('unsupported-code');
 const values=row.values.map(v=>mode==='toggle'?v===1:v*scale);
 if(mode==='toggle'){let active=false;for(const value of values){if(active&&!value&&!nativeExperienceProfile)fail('toggle-disable-not-representable');active ||= value;}}
 else if(values.some((v,i)=>i>0&&v<values[i-1]))fail('decreasing-ranks-require-explicit-range-adapter');
 return {bonus,mode,values,...(additionalBonuses.length?{additionalBonuses}:{}),...(additionalRuntimeBindings.length?{additionalRuntimeBindings}:{})};
}
function semanticRow(row){return {creature:row.creature,code:row.code,modifier:row.modifier,values:row.values};}
export function assertDefaultParity(sourceRows,installedRows){
 const defaults=rows=>rows.filter(r=>r.creature<0).map(r=>{rowMapping(r);return semanticRow(r);});
 if(JSON.stringify(defaults(sourceRows))!==JSON.stringify(defaults(installedRows)))throw new ExperienceCompileError([{code:'global-tier-defaults-mismatch',message:'Do not duplicate or assume global effects; installed negative rows must match source exactly.'}]);
 return {matched:true,rows:defaults(sourceRows).length,mode:'existing-native-globals-retained-without-duplication'};
}
/** Exact native JSON rank representation for supported rows.
 * Numeric values become additions above explicit R0, because the native JSON
 * loader already converts cumulative values to deltas at each rank threshold.
 * Independent-max changes use boolean thresholds with an explicit absolute val:
 * passing ordinary numeric independent-max arrays would lose levels under the
 * native loader's generic delta conversion (e.g. ENCHANTED 1 -> 2 -> 3 -> 6).
 */
export function compileCreatureExperience(rows,{creatureId,installedRows,rankZero='require-explicit',resolveSpell,resolveCreature,nativeExperienceProfile=false,dispelProtection,negativeSpellLevels,experienceAfterAttack,experienceStatusSelectors,experienceFortress,experienceDungeon,experienceBeforeAttack,experienceDefenseReduction,experienceCrystal,experienceWerewolf,experienceGolem,experienceSpring,experienceDemonology,experiencePrimalFaerie,experienceStronghold,deathBlowCRT,throwOnError=false}={}){
 if(!Number.isSafeInteger(creatureId)||creatureId<0)throw new TypeError('A nonnegative source creatureId is required');
 if(!['require-explicit','intrinsic'].includes(rankZero))throw new TypeError('Unknown rank-zero policy');
 const diagnostics=[],abilities={},stackExperience=[],mapped=[],runtimeBindings=[];let defaults=null;
 try{if(!installedRows)throw new ExperienceCompileError([{code:'missing-installed-defaults'}]);defaults=assertDefaultParity(rows,installedRows);}catch(e){if(e instanceof ExperienceCompileError)diagnostics.push(...e.diagnostics);else throw e;}
 const selected=rows.filter(r=>r.creature===creatureId);
 for(const [index,row]of selected.entries()){
  try{
   if(row.code==='e'&&selected.filter(r=>r.code==='e').length!==1)throw new ExperienceCompileError([{source:row.source,line:row.line,code:'duplicate-source-deathblow-row'}]);
   if(row.code==='b'&&selected.filter(r=>r.code==='b').length!==1)throw new ExperienceCompileError([{source:row.source,line:row.line,code:'duplicate-source-experience-defense-row'}]);
   if(row.code==='B'&&experiencePrimalFaerie==='source-primal-faerie-v1'&&selected.filter(r=>r.code==='B').length!==1)throw new ExperienceCompileError([{source:row.source,line:row.line,code:'duplicate-source-primal-block-row'}]);
   if(['r','B'].includes(row.code)&&experienceCrystal==='source-crystal-experience-v1'&&selected.filter(r=>r.code===row.code).length!==1)throw new ExperienceCompileError([{source:row.source,line:row.line,code:'duplicate-source-crystal-experience-row'}]);
   if(['r','L'].includes(row.code)&&experienceWerewolf==='source-werewolf-experience-v1'&&selected.filter(r=>r.code===row.code).length!==1)throw new ExperienceCompileError([{source:row.source,line:row.line,code:'duplicate-source-werewolf-experience-row'}]);
   if(row.code==='u'&&experienceDemonology==='source-demonology-mode2-v1'&&selected.filter(r=>r.code==='u').length!==1)throw new ExperienceCompileError([{source:row.source,line:row.line,code:'duplicate-source-round2-summoning-row'}]);
   if(row.code==='L'&&experienceGolem==='source-golem-experience-v1'&&selected.filter(r=>r.code==='L').length!==1)throw new ExperienceCompileError([{source:row.source,line:row.line,code:'duplicate-source-golem-deflection-row'}]);
   if(['p','L'].includes(row.code)&&experienceSpring==='source-spring-spirit-v1'&&selected.filter(r=>r.code===row.code).length!==1)throw new ExperienceCompileError([{source:row.source,line:row.line,code:'duplicate-source-spring-experience-row'}]);
   const mapping=rowMapping(row,{resolveSpell,resolveCreature,nativeExperienceProfile,dispelProtection,negativeSpellLevels,experienceAfterAttack,experienceStatusSelectors,experienceFortress,experienceDungeon,experienceBeforeAttack,experienceDefenseReduction,experienceCrystal,experienceWerewolf,experienceGolem,experienceSpring,experienceDemonology,experiencePrimalFaerie,experienceStronghold,deathBlowCRT}),{bonus,mode,values}=mapping,base=values[0];
   if(mapping.additionalRuntimeBindings)runtimeBindings.push(...mapping.additionalRuntimeBindings.map(b=>({source:row.source,line:row.line,...b})));
   if(mode==='runtime'){
    runtimeBindings.push({source:row.source,line:row.line,...mapping.runtimeBinding});
    mapped.push({source:row.source,line:row.line,code:row.code,modifier:row.modifier,mode,values,runtimeBinding:mapping.runtimeBinding});
    continue;
   }
   if(base&&rankZero!=='intrinsic')throw new ExperienceCompileError([{source:row.source,line:row.line,code:'rank-zero-requires-explicit-intrinsic-contract'}]);
   for(const [bonusIndex,emittedBonus]of[bonus,...mapping.additionalBonuses||[]].entries()){
   if(base)abilities[`crexp_${index}_rank0${bonusIndex?"_extra"+bonusIndex:""}`]={...emittedBonus,...(mode==='toggle'?{}:{val:base})};
   if(mode==='toggle'){
    if(!base&&values.slice(1).some(Boolean))stackExperience.push({bonus:emittedBonus,values:values.slice(1)});
   }else if(mode==='independent'){
    let previous=base;for(let rank=1;rank<=10;rank++)if(values[rank]>previous){stackExperience.push({bonus:{...emittedBonus,val:values[rank]},values:Array.from({length:10},(_,i)=>i+1>=rank)});previous=values[rank];}
   }else{
    const deltas=values.slice(1).map(v=>v-base);if(deltas.some(v=>v!==0))stackExperience.push({bonus:emittedBonus,values:deltas});
   }
   }
   mapped.push({source:row.source,line:row.line,code:row.code,modifier:row.modifier,rankZero:base,mode,values,bonus,...(mapping.additionalBonuses?{additionalBonuses:mapping.additionalBonuses}:{}),nativeReference:'VCMI lib/CCreatureHandler.cpp:975-1339'});
  }catch(e){if(e instanceof ExperienceCompileError)diagnostics.push(...e.diagnostics);else throw e;}
 }
 const ok=diagnostics.length===0;
 const result={ok,definition:ok?{abilities,stackExperience}:null,nativePreview:{abilities,stackExperience},diagnostics,defaults,mapped,runtimeBindings,creatureId,requirements:{...(selected.some(r=>r.code==='w'&&/^[1-5]$/.test(r.modifier))?{negativeSpellLevels:'source-w-level-v1'}:{}),...(runtimeBindings.some(b=>b.contract!=='source-deathblow-crt-v1')?{experienceStatusSelectors:runtimeBindings.find(b=>b.contract!=='source-deathblow-crt-v1').contract}:{}),...(selected.some(r=>r.code==='e')?{deathBlowCRT:'source-deathblow-crt-v1'}:{}),rankRangePolicy:'native-era-profile',...(selected.some(r=>r.code==='p')?{experiencePreAttackSpellPolicy:selected.some(r=>r.code==='p'&&r.modifier==='#37')?'source-p37-v1':selected.some(r=>r.code==='p'&&['#24','#25'].includes(r.modifier))?'source-p24-p25-v1':selected.some(r=>r.code==='p'&&r.modifier==='#57')?'source-p57-v1':'source-p50-v1'}:{}),...(selected.some(r=>['a','K'].includes(r.code))?{experienceAfterAttackSpellPolicy:'source-a62-K59-v1'}:{}),...(selected.some(r=>r.code==='w'&&['P','p'].includes(r.modifier))?{dispelProtection:'native-era-v1'}:{})}};
 if(!ok&&throwOnError)throw new ExperienceCompileError(diagnostics);return result;
}
