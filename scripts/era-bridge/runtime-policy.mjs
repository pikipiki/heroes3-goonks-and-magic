import{SULFIDE_REGENERATION}from'./roster8/sulfide-source.mjs';
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
   if(!['regeneration','sourceRegeneration','rebirth','meleeRage','petrification','blindness','allSpellImmunity','armySpellCost','spellDamageInversion','vampireDrain','artifactMimic','angelicArmyMorale','imposedSpells','dailyResources','physicalDeflection','experienceRegeneration','physicalBlock','sourceSplashRangeOne','sourceRangedResistance30','sourceRoundTwoDemons','preemptiveRetaliation','deathBlowCRT','defenseReduction'].includes(operation))throw new TypeError('Unknown native ERA operation '+operation);
   let valid=false;
   if(operation==='regeneration')valid=keys(service,['hitPoints','chancePercent'])&&Number.isInteger(service.hitPoints)&&fraction(service.hitPoints,1000000000)&&Number.isInteger(service.chancePercent)&&fraction(service.chancePercent,100);
   if(operation==='sourceRegeneration')valid=id==='tum-era:eraCreature350'&&keys(service,['hitPoints','chancePercent'])&&service.hitPoints===100&&service.chancePercent===100;
   if(operation==='rebirth')valid=keys(service,['chance','fraction','guaranteedFraction'])&&fraction(service.chance,1)&&fraction(service.fraction,1000)&&fraction(service.guaranteedFraction,1000);
   if(operation==='vampireDrain')valid=id==='tum-era:redBonesDragon'&&keys(service,[]);
   if(operation==='meleeRage'||operation==='petrification'||operation==='blindness'||operation==='allSpellImmunity'||operation==='armySpellCost'||operation==='spellDamageInversion')valid=keys(service,[]);
   if(operation==='deathBlowCRT')valid=['tum-era:eraCreature318','tum-era:eraCreature319','tum-era:ancestralBehemoth','tum-era:eraCreature361'].includes(id)&&keys(service,[]);
   if(operation==='defenseReduction')valid=keys(service,['percent'])&&service.percent===95;
   if(operation==='experienceRegeneration')valid=id==='tum-era:eraCreature339'?(keys(service,['chancePercent','values'])&&service.chancePercent===50&&Array.isArray(service.values)&&service.values.length===11&&service.values.every((v,i)=>v===SULFIDE_REGENERATION[i])):['tum-era:eraCreature267','tum-era:eraCreature268','tum-era:eraCreature273','tum-era:eraCreature294'].includes(id)&&keys(service,['chancePercent','values'])&&service.chancePercent===(id==='tum-era:eraCreature273'?50:100)&&Array.isArray(service.values)&&service.values.length===11&&service.values.every((v,i)=>v===i*(id==='tum-era:eraCreature273'?4:9));
   if(operation==='sourceRoundTwoDemons')valid=id==='third-upgrades:tumPitMaster'&&keys(service,['values'])&&Array.isArray(service.values)&&service.values.length===11&&service.values.every((v,i)=>v===[0,0,0,10,10,15,15,20,20,25,25][i]);
   if(operation==='sourceRangedResistance30')valid=['tum-era:eraCreature337','tum-era:eraCreature338'].includes(id)&&keys(service,[]);
   if(operation==='sourceSplashRangeOne')valid=id==='tum-era:eraCreature350'&&keys(service,[]);
   if(operation==='preemptiveRetaliation')valid=id==='tum-era:eraCreature280'&&keys(service,[]);
   if(operation==='physicalBlock')valid=['tum-era:eraCreature268','tum-era:eraCreature258'].includes(id)&&keys(service,['values'])&&Array.isArray(service.values)&&service.values.length===11&&service.values.every((v,i)=>v===Math.min(25,i*5));
   if(operation==='physicalDeflection')valid=keys(service,['modifier','values'])&&Number.isInteger(service.modifier)&&fraction(service.modifier,255)&&Array.isArray(service.values)&&service.values.length===11&&service.values.every(v=>Number.isInteger(v)&&fraction(v,255));
   if(operation==='artifactMimic')valid=keys(service,['artifact'])&&([129,135].includes(service.artifact)||(service.artifact===71&&id==='tum-era:eraCreature354'));
   if(operation==='angelicArmyMorale')valid=keys(service,['supremeArchangel'])&&qualified(service.supremeArchangel);
   if(operation==='imposedSpells')valid=Array.isArray(service)&&service.length<=3&&service.every(slot=>keys(slot,['spell','mastery'])&&supportedImposedSpells.includes(slot.spell)&&Number.isInteger(slot.mastery)&&fraction(slot.mastery,3));
   if(operation==='dailyResources')valid=keys(service,['resource','amount','goldPerCreature'])&&qualified(service.resource)&&Number.isInteger(service.amount)&&fraction(service.amount,1000000000)&&Number.isInteger(service.goldPerCreature)&&fraction(service.goldPerCreature,1000000000);
   if(!valid)throw new TypeError('Invalid native '+operation+' service for '+id);
  }
  if(operations.petrification&&operations.blindness)throw new TypeError('Conflicting ERA post-hit effects for '+id);
 }
 if(policy.artifacts!==undefined){
  if(!object(policy.artifacts))throw new TypeError('Invalid ERA artifact policies');
  for(const [id,service] of Object.entries(policy.artifacts)){
   if(!qualified(id)||!object(service)||!Object.keys(service).length||Object.keys(service).some(k=>!['dailyConversions','openingSummons','exchangeCloak','massSpells','goldenGoose','reflection','elementalFreedom'].includes(k)))throw new TypeError('Invalid ERA artifact services for '+id);
   if(service.elementalFreedom!==undefined&&(id!=='tum-era:artifact197'||!keys(service.elementalFreedom,[])))throw new TypeError('Invalid source Ring of Elements service for '+id);
   if(service.goldenGoose!==undefined&&(id!=='tum-era:artifact179'||!keys(service.goldenGoose,['countBackpack'])||typeof service.goldenGoose.countBackpack!=='boolean'))throw new TypeError('Invalid source Golden Goose service for '+id);
   if(service.reflection!==undefined&&(id!=='tum-era:artifact181'||!keys(service.reflection,['resistanceBonus'])||service.reflection.resistanceBonus!==20))throw new TypeError('Invalid source Reflection service for '+id);
   if(service.massSpells!==undefined){const expected=id==='tum-era:artifact262'?['core:resurrection','core:animateDead']:id==='tum-era:artifact263'?['core:implosion']:null;if(!expected||!keys(service.massSpells,['spells','powerPercent'])||service.massSpells.powerPercent!==30||JSON.stringify(service.massSpells.spells)!==JSON.stringify(expected))throw new TypeError('Invalid ERA artifact mass spells for '+id);}
   if(service.exchangeCloak!==undefined&&(id!=='tum-era:artifact261'||!keys(service.exchangeCloak,[])))throw new TypeError('Invalid ERA Exchange Cloak service for '+id);
   if(service.dailyConversions!==undefined&&(!Array.isArray(service.dailyConversions)||!service.dailyConversions.length||service.dailyConversions.length>9||!service.dailyConversions.every(pair=>keys(pair,['from','to'])&&qualified(pair.from)&&qualified(pair.to))))throw new TypeError('Invalid ERA artifact daily conversions for '+id);
   if(service.openingSummons!==undefined&&(!Array.isArray(service.openingSummons)||!service.openingSummons.length||service.openingSummons.length>9||!service.openingSummons.every(item=>keys(item,['creature','encodedPower'])&&qualified(item.creature)&&Number.isInteger(item.encodedPower)&&item.encodedPower>=-2147483648&&item.encodedPower<=2147483647)))throw new TypeError('Invalid ERA artifact opening summons for '+id);
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

// Daily_Res (Amethyst dllmain.cpp:410-479): a max per resource plus a tax
// per creature. Amount and tax default to zero in the original static tables.
export function compileDailyResourceService(text,{source='<creature.cfg>',target,resolveResource}={}){
 const parsed=parseAmethystCreature(text,{source});if(parsed.diagnostics.length)throw new AmethystCompilationError(parsed.diagnostics);
 const names=['ResGen_Type','ResGen_Amount','ResGen_Tax'],entries=new Map(parsed.entries.filter(e=>names.includes(e.key)).map(e=>[e.key,e]));
 if(!entries.has('ResGen_Type'))throw new TypeError(source+': missing ResGen_Type');
 const read=(key,maximum,fallback)=>{const entry=entries.get(key);if(!entry)return fallback;if(!/^\d+$/.test(entry.rawValue))throw new TypeError(source+': invalid '+key);const n=Number(entry.rawValue);if(!Number.isSafeInteger(n)||n>maximum)throw new TypeError(source+': invalid '+key);return n;};
 const resource=resolveResource?.(read('ResGen_Type',7));
 const service={resource,amount:read('ResGen_Amount',1000000000,0),goldPerCreature:read('ResGen_Tax',1000000000,0)};
 return {policy:validateRuntimePolicy({schemaVersion:1,creatures:{[target]:{dailyResources:service}}}),provenance:{source,scope:'daily resource service only',consumed:[...entries.values()],otherProperties:parsed.entries.filter(e=>!names.includes(e.key)),evidence:['Amethyst2/amethyst/dllmain.cpp:410-479'],notCovered:['Optional ERA Azylum hero storage','Other creature properties']}};
}
