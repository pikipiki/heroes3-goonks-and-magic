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

export const supportedImposedSpells=Object.freeze(['airShield','fireShield','protectionFromAir','protectionFromFire','protectionFromWater','protectionFromEarth','magicMirror','bloodlust','precision','stoneSkin','prayer','slayer'].map(id=>'core:'+id));
// The service registry is structural and exact: no unknown operation is ignored.
export function validateRuntimePolicy(policy){
 const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
 if(!object(policy)||policy.schemaVersion!==1||!object(policy.creatures)||Object.keys(policy).some(key=>!['schemaVersion','creatures','artifacts'].includes(key)))throw new TypeError('Invalid native ERA policy document');
 const qualified=id=>typeof id==='string'&&/^[-a-zA-Z0-9_.]+:[-a-zA-Z0-9_]+$/.test(id);
 const keys=(service,expected)=>object(service)&&Object.keys(service).length===expected.length&&Object.keys(service).every(k=>expected.includes(k));
 const fraction=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
 for(const [id,operations] of Object.entries(policy.creatures)){
  if(!/^[-a-zA-Z0-9_.]+:[-a-zA-Z0-9_]+$/.test(id)||!object(operations))throw new TypeError('Invalid native ERA creature '+id);
  for(const [operation,service] of Object.entries(operations)){
   if(!['regeneration','rebirth','meleeRage','petrification','spellDamageInversion','artifactMimic','angelicArmyMorale','imposedSpells','dailyResources'].includes(operation))throw new TypeError('Unknown native ERA operation '+operation);
   let valid=false;
   if(operation==='regeneration')valid=keys(service,['hitPoints','chancePercent'])&&Number.isInteger(service.hitPoints)&&fraction(service.hitPoints,1000000000)&&Number.isInteger(service.chancePercent)&&fraction(service.chancePercent,100);
   if(operation==='rebirth')valid=keys(service,['chance','fraction','guaranteedFraction'])&&fraction(service.chance,1)&&fraction(service.fraction,1000)&&fraction(service.guaranteedFraction,1000);
   if(operation==='meleeRage'||operation==='petrification'||operation==='spellDamageInversion')valid=keys(service,[]);
   if(operation==='artifactMimic')valid=keys(service,['artifact'])&&service.artifact===129;
   if(operation==='angelicArmyMorale')valid=keys(service,['supremeArchangel'])&&qualified(service.supremeArchangel);
   if(operation==='imposedSpells')valid=Array.isArray(service)&&service.length<=3&&service.every(slot=>keys(slot,['spell','mastery'])&&supportedImposedSpells.includes(slot.spell)&&Number.isInteger(slot.mastery)&&fraction(slot.mastery,3));
   if(operation==='dailyResources')valid=keys(service,['resource','amount','goldPerCreature'])&&qualified(service.resource)&&Number.isInteger(service.amount)&&fraction(service.amount,1000000000)&&Number.isInteger(service.goldPerCreature)&&fraction(service.goldPerCreature,1000000000);
   if(!valid)throw new TypeError('Invalid native '+operation+' service for '+id);
  }
 }
 if(policy.artifacts!==undefined){
  if(!object(policy.artifacts))throw new TypeError('Invalid ERA artifact policies');
  for(const [id,service] of Object.entries(policy.artifacts)){
   if(!qualified(id)||!keys(service,['dailyConversions'])||!Array.isArray(service.dailyConversions)||!service.dailyConversions.length||service.dailyConversions.length>9||!service.dailyConversions.every(pair=>keys(pair,['from','to'])&&qualified(pair.from)&&qualified(pair.to)))throw new TypeError('Invalid ERA artifact daily conversions for '+id);
  }
 }
 return structuredClone(policy);
}
export function mergeRuntimePolicies(policies){
 const output={schemaVersion:1,creatures:{}};
 const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
 for(const input of policies){
  const validated=validateRuntimePolicy(input);
  for(const group of ['creatures','artifacts'])for(const [id,operations] of Object.entries(validated[group]??{})){
   output[group]??={};const previous=output[group][id]??={};
   for(const [operation,service] of Object.entries(operations)){
    if(previous[operation]&&canonical(previous[operation])!==canonical(service))throw new TypeError('Conflicting ERA policies for '+id+' '+operation);
    previous[operation]=service;
   }
  }
 }
 return output;
}

export function compileRebirthService(text,{source='<creature.cfg>',target}={}){
 const parsed=parseAmethystCreature(text,{source});
 if(parsed.diagnostics.length)throw new AmethystCompilationError(parsed.diagnostics);
 const fields={'rebirth chance':'chance','rebirth fraction':'fraction','rebirth sure':'guaranteedFraction'};
 const service={},consumed=[];
 for(const [key,field] of Object.entries(fields)){
  const entry=parsed.entries.find(e=>e.key===key);
  if(!entry)throw new TypeError(source+': missing '+key);
  service[field]=Number(entry.rawValue);consumed.push(entry);
 }
 const policy=validateRuntimePolicy({schemaVersion:1,creatures:{[target]:{rebirth:service}}});
 return {policy,provenance:{source,scope:'rebirth service only',consumed,otherProperties:parsed.entries.filter(e=>!Object.hasOwn(fields,e.key)),evidence:['Amethyst2/amethyst/tables.cpp:4056-4115'],notCovered:['Creature experience rebirth','Per-stack Amethyst memory writes']}};
}

export function compileImposedSpellsService(text,{source='<creature.cfg>',target,resolveSpell}={}){
 const parsed=parseAmethystCreature(text,{source});if(parsed.diagnostics.length)throw new AmethystCompilationError(parsed.diagnostics);
 const entries=new Map(parsed.entries.map(e=>[e.key,e]));const imposedSpells=[],consumed=[];
 for(let i=1;i<=3;i++){
  const number=entries.get(`ImposedSpell${i}Number`),level=entries.get(`ImposedSpell${i}Level`);
  if(!number&&!level)continue;
  if(!number||!level)throw new TypeError(source+': incomplete imposed spell slot '+i);
  const id=Number(number.rawValue),mastery=Number(level.rawValue);
  if(!Number.isInteger(id)||id<0||id>127)throw new TypeError(source+': imposed spell ID must fit original signed byte');
  if(id!==0){const spell=resolveSpell?.(id);imposedSpells.push({spell,mastery});}
  consumed.push(number,level);
 }
 return {policy:validateRuntimePolicy({schemaVersion:1,creatures:{[target]:{imposedSpells}}}),provenance:{source,scope:'imposed spells service only',consumed,evidence:['Amethyst2/amethyst/tables.cpp:4359-4400','h3era.exe sub760627 resets round then calls imposed enchantment hook'],notCovered:['Other creature properties']}};
}
