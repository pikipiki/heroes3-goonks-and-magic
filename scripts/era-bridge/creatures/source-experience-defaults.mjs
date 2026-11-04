import {compileCreatureExperience,ExperienceCompileError} from './crexpbon.mjs';

export const SOURCE_EXPERIENCE_DEFAULTS_CONTRACT='source-default-experience-new-creature-v1';

/** Explicit common/tier rows for a fresh definition; never a patch for existing WoG bonuses. */
export function compileFreshSourceExperienceDefaults(rows,options={}){
 const {contract,freshDefinition,nativeDefaultCarrier,healthRoundingContract,sourceLevelZeroBased,creatureId,installedRows,nativeExperienceProfile}=options;
 const reject=code=>{throw new ExperienceCompileError([{source:'source-experience-defaults',line:0,code}]);};
 if(contract!==SOURCE_EXPERIENCE_DEFAULTS_CONTRACT)reject('explicit-source-default-contract-required');
 if(freshDefinition!==true)reject('fresh-definition-required-no-existing-defaults-may-be-retained');
 if(nativeDefaultCarrier!=='creature-json')reject('native-per-creature-json-default-carrier-required');
 if(nativeExperienceProfile!==true)reject('native-source-experience-profile-required');
 if(healthRoundingContract!==undefined&&healthRoundingContract!=='source-health-xp-rounding-v1')reject('unknown-source-health-rounding-contract');
 if(!Number.isSafeInteger(creatureId)||creatureId<197||creatureId>1023)reject('new-amethyst-creature-domain-required');
 if(!Number.isSafeInteger(sourceLevelZeroBased)||sourceLevelZeroBased<0||sourceLevelZeroBased>6)reject('unproven-source-default-tier');
 const sourceTier=-(sourceLevelZeroBased+1),available=rows.filter(r=>r.creature===-8||r.creature===sourceTier);
 const expected=new Set(['-8:H:%',sourceTier+':A:+',sourceTier+':D:+',sourceTier+':M:+',sourceTier+':m:+']);
 if(available.length!==expected.size)reject('unexpected-source-default-row-count');
 for(const r of available){
  const identity=r.creature+':'+r.code+':'+r.modifier;
  if(!expected.delete(identity))reject('unknown-or-duplicate-source-default-row');
  if(r.values[0]!==0)reject('nonzero-source-default-rank-zero-not-proven');
 }
 if(expected.size)reject('missing-source-default-row');
 // CrExpBon::Clear replaces defaults by type for A/D/H/m/M/S. It does not add
 // a creature's explicit A+9 to the tier's A+5. Modifiers do not distinguish
 // replacement identities here: even explicit H%0 removes common H%50.
 const own=rows.filter(r=>r.creature===creatureId),replacingTypes=new Set(['A','D','H','m','M','S']);
 for(const code of replacingTypes)if(own.filter(r=>r.code===code).length>1)reject('duplicate-own-default-replacement-type-not-closed');
 const ownTypes=new Set(own.filter(r=>replacingTypes.has(r.code)).map(r=>r.code));
 const suppressed=available.filter(r=>ownTypes.has(r.code)),selected=available.filter(r=>!ownTypes.has(r.code));
 const defaults=rows.filter(r=>r.creature<0);
 const result=compileCreatureExperience([...defaults,...selected.map(r=>({...r,creature:creatureId}))],{creatureId,installedRows,rankZero:'intrinsic',nativeExperienceProfile:true,throwOnError:true});
 const definition=structuredClone(result.definition),runtimeObligations=[];
 for(let i=definition.stackExperience.length-1;i>=0;--i){
  const row=definition.stackExperience[i];
  if(row.bonus.type!=='STACK_HEALTH')continue;
  if(healthRoundingContract==='source-health-xp-rounding-v1')row.bonus={type:'ERA_EXPERIENCE_HEALTH_PERCENT',valueType:'ADDITIVE_VALUE',hidden:true};
  else{
   runtimeObligations.push({code:'source-health-rounding-adapter-required',contract:'source-health-xp-rounding-v1',sourceRows:selected.filter(r=>r.code==='H').map(r=>({source:r.source,line:r.line,values:r.values})),reason:'Source rounds percent health to nearest after pre-XP HP; native PERCENT_TO_BASE truncates and is not emitted.'});
   definition.stackExperience.splice(i,1);
  }
 }
 const describe=r=>({source:r.source,line:r.line,sourceCreature:r.creature,code:r.code,modifier:r.modifier,values:r.values});
 return {...result,ok:runtimeObligations.length===0,definition:runtimeObligations.length?null:definition,nativePreview:definition,runtimeObligations,healthRoundingContract:healthRoundingContract??null,sourceDefaultRows:selected.map(describe),sourceDefaultsReplacedByOwn:suppressed.map(describe),contract,sourceLevelZeroBased,sourceTier,freshDefinition:true,activationReady:false};
}

/** Convert only a source-proven own H% row, preserving all unrelated XP rows. */
export function adaptSourceOwnHealthExperience(stackExperience, sourceOwnRows, healthRoundingContract, sourceFallbackHealth){
 const rows=structuredClone(stackExperience),own=sourceOwnRows.filter(r=>r.code==='H');
 const health=rows.filter(r=>['STACK_HEALTH','ERA_EXPERIENCE_HEALTH_PERCENT'].includes(r.bonus.type));
 const fail=code=>{throw new ExperienceCompileError([{source:'source-own-health',line:0,code}]);};
 if(own.length>1)fail('duplicate-own-health-not-closed');
 if(!own.length&&!health.length)return {stackExperience:rows,convertedOwnHealth:0};
 if(!own.length&&!sourceFallbackHealth)fail('unexplained-existing-health-experience');
 const source=own[0]??sourceFallbackHealth;
 if(source.modifier!=='%'||source.values[0]!==0)fail('noncanonical-own-health-not-closed');
 const expected=source.values.slice(1),nonzero=expected.some(Boolean);
 if(health.length!==(nonzero?1:0))fail('own-health-row-count-mismatch');
 if(!nonzero)return {stackExperience:rows,convertedOwnHealth:0};
 if(healthRoundingContract!=='source-health-xp-rounding-v1')fail('source-health-rounding-adapter-required');
 const row=health[0];
 if(JSON.stringify(row.values)!==JSON.stringify(expected))fail('own-health-values-mismatch');
 if(row.bonus.type==='STACK_HEALTH'&&row.bonus.valueType!=='PERCENT_TO_BASE')fail('own-health-value-type-mismatch');
 row.bonus={type:'ERA_EXPERIENCE_HEALTH_PERCENT',valueType:'ADDITIVE_VALUE',hidden:true};
 return {stackExperience:rows,convertedOwnHealth:own.length?1:0,verifiedDefaultHealth:own.length?0:1};
}
