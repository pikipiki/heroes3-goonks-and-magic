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
function rowMapping(row,{resolveSpell,resolveCreature,nativeExperienceProfile=false,dispelProtection}={}){
 const fail=(code,extra={})=>{throw new ExperienceCompileError([{source:row.source,line:row.line,code,legacyCode:row.code,modifier:row.modifier,...extra}]);};
 const resolved=(kind,n)=>{const value=(kind==='spell'?resolveSpell:resolveCreature)?.(n);if(typeof value!=='string'||!value.includes(':'))fail('unresolved-id',{kind,id:n});return value;};
 const numberMod=()=>{if(!/^#\d+$/.test(row.modifier))fail('unsupported-modifier');const n=Number(row.modifier.slice(1));if(!Number.isSafeInteger(n)||n>2147483647)fail('modifier-id-range');return n;};
 let bonus,mode='numeric',scale=1;
 if(additive[row.code]){
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
  else if(toggles[row.modifier])bonus={type:toggles[row.modifier]};else fail('unsupported-modifier');
  if(row.values.some(v=>![0,1,2].includes(v)))fail('invalid-toggle');
 }else if(row.code==='i'||row.code==='o'){
  if(!['+','='].includes(row.modifier))fail('unsupported-modifier');mode='toggle';bonus={type:row.code==='i'?'NO_DISTANCE_PENALTY':'NO_WALL_PENALTY'};
 }else if(row.code==='w'){
  mode='toggle';if(spellImmunity[row.modifier]!==undefined)bonus={type:'SPELL_IMMUNITY',subtype:resolved('spell',spellImmunity[row.modifier])};
  else if(row.modifier==='m')bonus={type:'MIND_IMMUNITY'};
  else if(['P','p'].includes(row.modifier)){if(dispelProtection!=='native-era-v1'||nativeExperienceProfile!==true)fail('dispel-protection-requires-native-profile-and-adapter');bonus={type:'ERA_DISPEL_IMMUNITY',val:row.modifier==='P'?1:2};}
  else if('AFWE'.includes(row.modifier))bonus={type:'NEGATIVE_EFFECTS_IMMUNITY',subtype:'spellSchool.'+({A:'air',F:'fire',W:'water',E:'earth'})[row.modifier]};
  else if('afwe'.includes(row.modifier))bonus={type:'SPELL_SCHOOL_IMMUNITY',subtype:'spellSchool.'+({a:'air',f:'fire',w:'water',e:'earth'})[row.modifier]};
  else if(/^[6789:]$/.test(row.modifier))bonus={type:'LEVEL_SPELL_IMMUNITY',val:row.modifier===':'?5:Number(row.modifier)-5};
  else if(row.modifier==='0')bonus={type:'RECEPTIVE'};
  else fail('unsupported-modifier');
  if(row.values.some(v=>![0,1,2].includes(v)))fail('invalid-toggle');
 }else if(['a','c','K','k','p','J'].includes(row.code)){
  bonus={type:['p','J'].includes(row.code)?'SPELL_BEFORE_ATTACK':'SPELL_AFTER_ATTACK',subtype:resolved('spell',numberMod()),valueType:'ADDITIVE_VALUE',...(['p','J'].includes(row.code)?{addInfo:3}:{})};
  if(row.values.some(v=>v<0||v>100))fail('chance-range');
 }else if(row.code==='h'){
  bonus={type:'HATE',subtype:resolved('creature',numberMod()),valueType:'ADDITIVE_VALUE'};scale=10;
 }else if(row.code==='s'){
  bonus={type:'ENCHANTED',subtype:resolved('spell',numberMod()),valueType:'INDEPENDENT_MAX'};mode='independent';
  if(row.values.some(v=>v<0||v>6))fail('enchantment-range');
 }else if(row.code==='r')fail('regeneration-chance-requires-native-adapter');
 else if(row.code==='L')fail('random-damage-deflection-requires-native-adapter');
 else if(row.code==='U')fail('periodic-summoning-requires-native-adapter');
 else fail('unsupported-code');
 const values=row.values.map(v=>mode==='toggle'?v===1:v*scale);
 if(mode==='toggle'){let active=false;for(const value of values){if(active&&!value&&!nativeExperienceProfile)fail('toggle-disable-not-representable');active ||= value;}}
 else if(values.some((v,i)=>i>0&&v<values[i-1]))fail('decreasing-ranks-require-explicit-range-adapter');
 return {bonus,mode,values};
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
export function compileCreatureExperience(rows,{creatureId,installedRows,rankZero='require-explicit',resolveSpell,resolveCreature,nativeExperienceProfile=false,dispelProtection,throwOnError=false}={}){
 if(!Number.isSafeInteger(creatureId)||creatureId<0)throw new TypeError('A nonnegative source creatureId is required');
 if(!['require-explicit','intrinsic'].includes(rankZero))throw new TypeError('Unknown rank-zero policy');
 const diagnostics=[],abilities={},stackExperience=[],mapped=[];let defaults=null;
 try{if(!installedRows)throw new ExperienceCompileError([{code:'missing-installed-defaults'}]);defaults=assertDefaultParity(rows,installedRows);}catch(e){if(e instanceof ExperienceCompileError)diagnostics.push(...e.diagnostics);else throw e;}
 const selected=rows.filter(r=>r.creature===creatureId);
 for(const [index,row]of selected.entries()){
  try{
   const mapping=rowMapping(row,{resolveSpell,resolveCreature,nativeExperienceProfile,dispelProtection}),{bonus,mode,values}=mapping,base=values[0];
   if(base&&rankZero!=='intrinsic')throw new ExperienceCompileError([{source:row.source,line:row.line,code:'rank-zero-requires-explicit-intrinsic-contract'}]);
   if(base)abilities[`crexp_${index}_rank0`]={...bonus,...(mode==='toggle'?{}:{val:base})};
   if(mode==='toggle'){
    if(!base&&values.slice(1).some(Boolean))stackExperience.push({bonus,values:values.slice(1)});
   }else if(mode==='independent'){
    let previous=base;for(let rank=1;rank<=10;rank++)if(values[rank]>previous){stackExperience.push({bonus:{...bonus,val:values[rank]},values:Array.from({length:10},(_,i)=>i+1>=rank)});previous=values[rank];}
   }else{
    const deltas=values.slice(1).map(v=>v-base);if(deltas.some(v=>v!==0))stackExperience.push({bonus,values:deltas});
   }
   mapped.push({source:row.source,line:row.line,code:row.code,modifier:row.modifier,rankZero:base,mode,values,bonus,nativeReference:'VCMI lib/CCreatureHandler.cpp:975-1339'});
  }catch(e){if(e instanceof ExperienceCompileError)diagnostics.push(...e.diagnostics);else throw e;}
 }
 const ok=diagnostics.length===0;
 const result={ok,definition:ok?{abilities,stackExperience}:null,nativePreview:{abilities,stackExperience},diagnostics,defaults,mapped,creatureId,requirements:{rankRangePolicy:'native-era-profile',...(selected.some(r=>r.code==='w'&&['P','p'].includes(r.modifier))?{dispelProtection:'native-era-v1'}:{})}};
 if(!ok&&throwOnError)throw new ExperienceCompileError(diagnostics);return result;
}
