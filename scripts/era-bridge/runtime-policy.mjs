import {parseAmethystCreature,AmethystCompilationError} from './amethyst.mjs';
// A named service adapter, not a declaration that the whole creature/plugin is
// supported. This consumes exactly the two original regeneration properties.
export function compileRegenerationService(text,{source='<creature.cfg>',target}={}){
 if(typeof target!=='string'||!/^[-a-zA-Z0-9_.]+:[-a-zA-Z0-9_]+$/.test(target))throw new TypeError('Expected a qualified VCMI creature identifier');
 const parsed=parseAmethystCreature(text,{source});if(parsed.diagnostics.length)throw new AmethystCompilationError(parsed.diagnostics);
 const keys=['RegenerationHitPoints','RegenerationChance'],selected=parsed.entries.filter(e=>keys.includes(e.key));
 const diagnostic=(key,message)=>({source,line:selected.find(e=>e.key===key)?.line||1,key,code:'INVALID_REGENERATION_SERVICE',message});
 const diagnostics=[];for(const key of keys)if(!selected.some(e=>e.key===key))diagnostics.push(diagnostic(key,'Both regeneration fields are required'));
 if(diagnostics.length)throw new AmethystCompilationError(diagnostics);
 const hitPoints=Number(selected.find(e=>e.key===keys[0]).rawValue),chancePercent=Number(selected.find(e=>e.key===keys[1]).rawValue);
 if(hitPoints>1000000000)throw new AmethystCompilationError([diagnostic(keys[0],'Native runtime regeneration exceeds supported HP range')]);
 return {policy:{schemaVersion:1,creatures:{[target]:{regeneration:{hitPoints,chancePercent}}}},provenance:{source,scope:'regeneration service only',consumed:selected,otherProperties:parsed.entries.filter(e=>!keys.includes(e.key)).map(e=>({key:e.key,line:e.line})),evidence:['Amethyst2/amethyst/tables.cpp:5106-5128','VCMI server/battles/BattleFlowProcessor.cpp native era_compat::Policies gate'],notCovered:['Other creature properties','Other Amethyst services','ERM callbacks','Windows DLL execution']}};
}

export function validateRuntimePolicy(policy){
 const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
 if(!object(policy)||policy.schemaVersion!==1||!object(policy.creatures)||Object.keys(policy).some(key=>!['schemaVersion','creatures'].includes(key)))throw new TypeError('Invalid native ERA policy document');
 for(const [id,operations] of Object.entries(policy.creatures)){
  if(!/^[-a-zA-Z0-9_.]+:[-a-zA-Z0-9_]+$/.test(id)||!object(operations)||Object.keys(operations).some(key=>key!=='regeneration'))throw new TypeError('Unknown native ERA operation or invalid creature '+id);
  for(const service of Object.values(operations))if(!object(service)||Object.keys(service).some(key=>!['hitPoints','chancePercent'].includes(key))||!Number.isInteger(service.hitPoints)||service.hitPoints<0||service.hitPoints>1000000000||!Number.isInteger(service.chancePercent)||service.chancePercent<0||service.chancePercent>100)throw new TypeError('Invalid native regeneration service for '+id);
 }
 return structuredClone(policy);
}
export function mergeRuntimePolicies(policies){
 const output={schemaVersion:1,creatures:{}};
 for(const input of policies)for(const [id,operations] of Object.entries(validateRuntimePolicy(input).creatures)){
  const previous=output.creatures[id];
  if(previous&&(previous.regeneration?.hitPoints!==operations.regeneration?.hitPoints||previous.regeneration?.chancePercent!==operations.regeneration?.chancePercent))throw new TypeError('Conflicting ERA policies for '+id);
  output.creatures[id]=operations;
 }
 return output;
}
