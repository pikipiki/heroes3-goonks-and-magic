import{reviewedRustDragonling,SOURCE_RUST_DRAGONLING_CONTRACT}from'../roster8/rust-dragonling.mjs';
import{reviewedFaerieDragonling,SOURCE_FAERIE_DRAGONLING_CONTRACT}from'../roster8/faerie-dragonling.mjs';
import {reviewedNeutralDependency,SOURCE_NEUTRAL_DEPENDENCIES_CONTRACT} from '../roster8/neutral-transform-source.mjs';
import {reviewedDungeon,SOURCE_DUNGEON_CONTRACT} from '../roster8/dungeon-source.mjs';
import {reviewedConflux,SOURCE_CONFLUX_CONTRACT} from '../roster8/conflux-source.mjs';
import {reviewedFortress,SOURCE_FORTRESS_CONTRACT} from '../roster8/fortress-counterstrikes.mjs';
import {reviewedPrimalFaerie,SOURCE_PRIMAL_FAERIE_CONTRACT} from '../roster8/primal-faerie.mjs';
import {reviewedMithrilGolem,SOURCE_MITHRIL_GOLEM_CONTRACT} from '../roster8/mithril-golem.mjs';
import{requireSourceDeathBlowBinding}from'./death-blow-contract.mjs';
/** Amethyst source-aware compiler. Policies are obligations, never working features.
 * Fresh definitions only: merging an arbitrary base silently retains disabled flags.
 */
import { readFileSync } from 'node:fs';
import { classifySourceBiology, nativeBiologyContract } from './biology.mjs';
import { classifySourceInanimateBiology, SOURCE_INANIMATE_BIOLOGY_CONTRACT } from '../roster8/source-biology.mjs';
import {sourceDemonologyCaster,SOURCE_DEMONOLOGY_CONTRACT} from '../roster8/demonology-source.mjs';
import { compileSourceTemplarCaster, compileSourceTemplarMorale, SOURCE_TEMPLAR_CASTER_CONTRACT, SOURCE_TEMPLAR_MORALE_CONTRACT } from '../roster8/templar-caster.mjs';
export const inventory = JSON.parse(readFileSync(new URL('./property-inventory.json', import.meta.url)));
export const provenance = Object.freeze({tumRevision:inventory.tumRevision, sourceRevision:inventory.sourceRevision, sourceBinaryParity:'unverified'});
const known = new Map(inventory.properties.map(p => [p.key,p]));
const source = (key) => ({file:'Amethyst2/amethyst/tables.cpp', lines:known.get(key)?.sourceParserLines ?? [], ...provenance,...(key==='Fearless'?{binarySha256:'451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181',evidenceId:'ev_90e2a20c7f7565be7ffcfbedd51e54efc1c36909c4cee090f40b5270d6bb127d',binaryAddress:'0x7604d0',observation:'xor eax,eax; return zero fear probability'}:{})});
const toggles = {
  NoWallPenalty:'NO_WALL_PENALTY', StrikeAndReturn:'RETURN_AFTER_STRIKE',
  isCerberus:'THREE_HEADED_ATTACK', JoustingImmune:'CHARGE_IMMUNITY',
};
const scalar = {ReduceTargetDefense:'ENEMY_DEFENCE_REDUCTION', DeathBlow:'DOUBLE_DAMAGE_CHANCE', ManaDrain:'MANA_DRAIN'};
const enumNames = {
  'Spell effect':['BIND','BLIND','DISEASE','CURSE','AGE','STONE','PARALYZE','POISON','ACID','DEFAULT','CUSTOM','SELF','AROUND','AROUND2'],
  'Attack effect':['VAMPIRE','THUNDER','DEATHSTARE','DISPEL','DISRUPT','DEFAULT'],
  'Resistance effect':['DWARF20','DWARF40','LEVEL123','LEVEL1234','MAGICIMMUNE','AS_AIR','AS_EARTH','AS_FIRE','DEFAULT','DWARF60','DWARF80','DWARF100','LEVEL1','LEVEL12','SPEED','TOXIC','WILL','NO_EYES','MASS_DAMAGE','DISPEL','DEBUFF'],
  'Vulnerability effect':['HALF','QUARTER','LIGHTNING','SHOWER','ICE','FIRE','GOLD','DIAMOND','DEFAULT','GOLEM125','GOLEM150','GOLEM200','GOLEM300','GOLEM400','GOLEM500','GOLEM600','GOLEM700','GOLEM900'],
};
// Bit positions come from H3CombatMonster.hpp:47-86, not creature-name guesses.
const flagBonus = {
  1:['FLYING'], 2:['SHOOTER'], 3:['TWO_HEX_ATTACK_BREATH'],
  10:['MIND_IMMUNITY'], 11:['NO_WALL_PENALTY'], 12:['NO_MELEE_PENALTY'],
  14:['SPELL_SCHOOL_IMMUNITY',0,'spellSchool.fire'], 15:['ADDITIONAL_ATTACK',1],
  16:['BLOCKS_RETALIATION'],17:['NO_MORALE'],18:['UNDEAD'],
  19:['ATTACKS_ALL_ADJACENT'],31:['DRAGON_NATURE'],
};
export class CreaturePropertyError extends Error {
  constructor(diagnostics) {super(diagnostics.map(d=>`${d.source}:${d.line} ${d.code}: ${d.message}`).join('\n'));this.name='CreaturePropertyError';this.diagnostics=diagnostics;}
}
export function parseCreatureProperties(text,{source='<cfg>'}={}) {
  if(typeof text!=='string')throw new TypeError('Expected cfg text');
  const entries=[],diagnostics=[],seen=new Set();
  text.replace(/^\uFEFF/,'').split(/\r\n|\r|\n/).forEach((raw,i)=>{
    const line=raw.trim();if(!line||/^(;|#|\/\/)/.test(line))return;
    const m=/^([^=]+)=(.*)$/.exec(line);
    if(!m||!m[2].trim()){diagnostics.push({source,line:i+1,code:'MALFORMED',message:raw});return;}
    const key=m[1].trim(),value=m[2].trim();
    if(seen.has(key))diagnostics.push({source,line:i+1,key,code:'DUPLICATE',message:key});
    seen.add(key);entries.push({source,line:i+1,key,rawValue:value});
  });
  if(diagnostics.length)throw new CreaturePropertyError(diagnostics);
  return entries;
}
/** analyseOnly reports all obligations. Executable compilation rejects any unbound
 * policy and rejects source/binary parity uncertainty unless independently proven.
 * resolveCreature/Spell/Town/Artifact return fully qualified VCMI identifiers.
 */
export function compileCreatureProperties(text,options={}) {
  if(options.nativeRustDragonlingContract!==undefined&&options.nativeRustDragonlingContract!==SOURCE_RUST_DRAGONLING_CONTRACT)throw new TypeError('Unknown source344 contract');
  if(options.nativeFaerieDragonlingContract!==undefined&&options.nativeFaerieDragonlingContract!==SOURCE_FAERIE_DRAGONLING_CONTRACT)throw new TypeError('Unknown source343 contract');
  if(options.nativeNeutralDependenciesContract!==undefined&&options.nativeNeutralDependenciesContract!==SOURCE_NEUTRAL_DEPENDENCIES_CONTRACT)throw new TypeError('Unknown neutral dependency contract');
  if(options.nativeNeutralDependenciesContract&&[286,294].includes(options.sourceCreatureId))reviewedNeutralDependency(text,{sourceId:options.sourceCreatureId,contract:options.nativeNeutralDependenciesContract});
  if(options.nativeConfluxContract!==undefined&&options.nativeConfluxContract!==SOURCE_CONFLUX_CONTRACT)throw new TypeError('Unknown native Conflux contract');
  if(options.nativeDungeonContract!==undefined&&options.nativeDungeonContract!==SOURCE_DUNGEON_CONTRACT)throw new TypeError('Unknown native Dungeon contract');
  if(options.nativeFortressContract!==undefined&&options.nativeFortressContract!==SOURCE_FORTRESS_CONTRACT)throw new TypeError("Unknown native Fortress contract");
  if(options.nativePrimalFaerieContract!==undefined&&options.nativePrimalFaerieContract!==SOURCE_PRIMAL_FAERIE_CONTRACT)throw new TypeError('Unknown native Primal Faerie contract');
  if(options.nativeConstructContract!==undefined&&options.nativeConstructContract!==SOURCE_MITHRIL_GOLEM_CONTRACT)throw new TypeError('Unknown native construct contract');
  if(options.nativeBiologyContract!==undefined&&![nativeBiologyContract,SOURCE_INANIMATE_BIOLOGY_CONTRACT].includes(options.nativeBiologyContract))throw new TypeError('Unknown native biology contract');
  const entries=parseCreatureProperties(text,options),definition={abilities:{}},policies=[],mappings=[],diagnostics=[];
  const conflux=options.nativeConfluxContract===SOURCE_CONFLUX_CONTRACT&&[355,356].includes(options.sourceCreatureId)?reviewedConflux(text,{sourceId:options.sourceCreatureId,contract:options.nativeConfluxContract,resolveSpell:options.resolveSpell}):undefined;
  if(conflux)Object.assign(definition.abilities,conflux.abilities);
  const dungeon=options.nativeDungeonContract===SOURCE_DUNGEON_CONTRACT&&[351,352].includes(options.sourceCreatureId)?reviewedDungeon(text,{sourceId:options.sourceCreatureId,contract:options.nativeDungeonContract}):undefined;
  if(dungeon){Object.assign(definition.abilities,dungeon.abilities);if(dungeon.graphics)definition.graphics=dungeon.graphics;}
  const fortress=options.nativeFortressContract===SOURCE_FORTRESS_CONTRACT&&[353,354].includes(options.sourceCreatureId)?reviewedFortress(text,{sourceId:options.sourceCreatureId,contract:options.nativeFortressContract}):undefined;
  if(fortress)Object.assign(definition.abilities,fortress.abilities);
  const rustDragonling=options.nativeRustDragonlingContract===SOURCE_RUST_DRAGONLING_CONTRACT&&options.sourceCreatureId===344?reviewedRustDragonling(text,{sourceId:344,contract:options.nativeRustDragonlingContract}):undefined;
  const faerieDragonling=options.nativeFaerieDragonlingContract===SOURCE_FAERIE_DRAGONLING_CONTRACT&&options.sourceCreatureId===343?reviewedFaerieDragonling(text,{sourceId:343,contract:options.nativeFaerieDragonlingContract,resolveSpell:options.resolveSpell}):undefined;
  if(faerieDragonling)Object.assign(definition.abilities,faerieDragonling.abilities);
  const primalFaerie=options.nativePrimalFaerieContract===SOURCE_PRIMAL_FAERIE_CONTRACT&&options.sourceCreatureId===258?reviewedPrimalFaerie(text,{sourceId:258,contract:options.nativePrimalFaerieContract,resolveSpell:options.resolveSpell}):undefined;
  if(primalFaerie)Object.assign(definition.abilities,primalFaerie.abilities);
  const mithrilGolem=options.nativeConstructContract===SOURCE_MITHRIL_GOLEM_CONTRACT&&options.sourceCreatureId===324?reviewedMithrilGolem(text,{sourceId:324,contract:options.nativeConstructContract}):undefined;
  const activeCaster=options.nativeActiveCasterContract===SOURCE_TEMPLAR_CASTER_CONTRACT&&[269,278,331,332].includes(options.sourceCreatureId)
    ?compileSourceTemplarCaster(text,{sourceId:options.sourceCreatureId,contract:options.nativeActiveCasterContract}):undefined;
  const demonology=options.nativeDemonologyContract===SOURCE_DEMONOLOGY_CONTRACT&&[217,338].includes(options.sourceCreatureId)?sourceDemonologyCaster(text,{sourceId:options.sourceCreatureId,contract:options.nativeDemonologyContract}):undefined;
  const values=new Map(entries.map(e=>[e.key,e]));
  if(options.freshDefinition!==true)throw new TypeError('freshDefinition:true is required; inherited abilities cannot be overwritten safely');
  const issue=(e,code,message)=>diagnostics.push({...e,code,message});
  const numeric=(e)=>{
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(e.rawValue)){issue(e,'INVALID_NUMBER',e.rawValue);return NaN;}
    const n=Number(e.rawValue);if(!Number.isFinite(n))issue(e,'INVALID_NUMBER',e.rawValue);return n;
  };
  const integer=(e,min=-2147483648,max=2147483647)=>{const n=numeric(e);if(!Number.isInteger(n)||n<min||n>max)issue(e,'INVALID_INTEGER',`${e.key}: expected ${min}..${max}`);return n;};
  const resolve=(e,kind,id)=>{
    const fn=options['resolve'+kind];if(typeof fn!=='function'){issue(e,'MISSING_RESOLVER',kind);return;}
    let result;try{result=fn(id);}catch(error){issue(e,'RESOLVER_FAILED',error.message);return;}
    if(typeof result!=='string'||!result.trim()){issue(e,'UNRESOLVED',`${kind} ${id}`);return;}
    return result;
  };
  const mapped=(e,operation)=>mappings.push({...e,operation,evidence:source(e.key)});
  const ability=(e,type,val=0,subtype,extra={})=>{definition.abilities['amethyst_'+e.key.replace(/\W/g,'_')]={type,val,...(subtype===undefined?{}:{subtype}),...extra};mapped(e,type);};
  const policy=(e,kind,parameters,reason,evidence={})=>{
    const requirement={kind,keys:[e.key],parameters,reason,evidence:{...source(e.key),...evidence},bound:false};
    const binding=options.runtimeBindings?.[kind];
    if(binding){
      if(typeof binding.validate!=='function'||!binding.implementation||!binding.evidence?.length){issue(e,'INVALID_RUNTIME_BINDING',kind);}
      else {
        const result=binding.validate(structuredClone(requirement));
        if(result===true){requirement.bound=true;requirement.binding={implementation:binding.implementation,evidence:binding.evidence};}
        else issue(e,'RUNTIME_REJECTED',`${kind}: ${String(result)}`);
      }
    }
    policies.push(requirement);mapped(e,`runtime:${kind}`);return requirement;
  };
  for(const e of entries){
    const {key}=e;
    if(!known.has(key)&&!/^Hate\d{4}$/.test(key)){issue(e,'UNKNOWN_PROPERTY',key);continue;}
    const n=numeric(e);if(!Number.isFinite(n))continue;
    if(key==='DoNotGenerate'&&options.nativeRandomExclusionContract==='source-random-exclusion-v1'){
      const value=integer(e,0,1);if(value===1)definition.special=true;mapped(e,'creature.special excludes native random selection');
    }
    else if(conflux?.consumedKeys.includes(key)){mapped(e,'source-conflux-eighth-v1 whole reviewed source service');}
    else if(dungeon?.consumedKeys.includes(key)){mapped(e,'source-dungeon-eighth-v1 reviewed source service');}
    else if(fortress?.consumedKeys.includes(key)){mapped(e,'source-fortress-counterstrikes-v1 whole reviewed service');}
    else if(rustDragonling?.consumedKeys.includes(key)){mapped(e,'source-rust-dragonling-v1 queued acid defence80 service');}
    else if(faerieDragonling?.consumedKeys.includes(key)){mapped(e,'source-faerie-dragonling-v1 whole reviewed pool/aim/power service');}
    else if(primalFaerie?.consumedKeys.includes(key)){mapped(e,'source-primal-faerie-v1 whole reviewed casting/defend/absorption service');}
    else if(demonology&&['Spell 1','Spell 2','Spell 3','Demonology'].includes(key)){
      Object.assign(definition.abilities,demonology.abilities);mapped(e,'source-mode2-demonology-caster');
    }
    else if(activeCaster&&['Spell 1','Spell 2','Spell 3','CastsSpell'].includes(key)){
      Object.assign(definition.abilities,activeCaster.abilities);mapped(e,'source-templar-active-caster');
    }
    else if(key==='Level'){definition.level=integer(e,0,7)+1;mapped(e,'level + 1');}
    else if(key==='Town'){definition.faction=resolve(e,'Town',integer(e,-1,8));mapped(e,'faction');}
    else if(/^Hate\d{4}$/.test(key))ability(e,'ERA_PERSONAL_HATE_DAMAGE',integer(e,0),resolve(e,'Creature',Number(key.slice(4))));
    else if(key==='Flags'){
      const bits=integer(e)>>>0;definition.doubleWide=!!(bits&1);
      for(const [bit,[type,val=0,subtype]] of Object.entries(flagBonus))if(bits&(2**bit)){
        definition.abilities[`amethyst_flag_${bit}`]={type,val,...(subtype===undefined?{}:{subtype})};
      }
      // KING bits are mutually exclusive in valid originals; malformed masks fail.
      const kings=[7,8,9].filter(bit=>bits&(2**bit));
      if(kings.length>1)issue(e,'AMBIGUOUS_KING_FLAGS','Multiple slayer tiers');
      // KING1 dragons are affected even by mastery0 Slayer. KING2 and KING3
      // require advanced/expert mastery respectively (native core definitions).
      if(kings.length===1)definition.abilities.amethystKing={type:'KING',val:kings[0]===7?0:kings[0]-6};
      const handled=[0,1,2,3,7,8,9,10,11,12,14,15,16,17,18,19,31];
      const residual=Array.from({length:32},(_,i)=>i).filter(i=>!handled.includes(i)&&(bits&(2**i)));
      // ALIVE=0 also matters: a fresh native creature becomes LIVING unless
      // explicitly UNDEAD/NON_LIVING. Never silently accept that opposite case.
      const biology={sourceAlive:!!(bits&16),sourceUndead:!!(bits&0x40000),nativeAutomaticLivingRequiresExplicitEquivalence:true};
      // ALIVE controls eligibility in original executable; VCMI auto-adds LIVING
      // when loading non-UNDEAD/non-NON_LIVING definitions. Preserve difference.
      const category=options.nativeBiologyContract===SOURCE_INANIMATE_BIOLOGY_CONTRACT?classifySourceInanimateBiology(n):classifySourceBiology(n);
      if(category.error)issue(e,category.error,category.reason);
      const opted=[nativeBiologyContract,SOURCE_INANIMATE_BIOLOGY_CONTRACT].includes(options.nativeBiologyContract);
      const semanticResidual=opted&&category.closed?residual.filter(bit=>bit!==4):residual;
      if(opted&&category.closed){
        if(category.nature!=='UNDEAD')definition.abilities.amethystBiology={type:category.nature};
        mapped(e,'source-native-biology:'+category.nature);
      }
      if(!opted||!category.closed||semanticResidual.length)policy(e,'era-creature-flag-semantics',{unsignedMask:bits,residualBits:semanticResidual,biology,...(opted?{category}: {})},'Original executable flag and biological behavior must be verified for both ALIVE=0 and ALIVE=1, including catapult, obstacle, magog and initial state bits',{file:'Amethyst2/amethyst/H3CombatMonster.hpp',lines:[47,86]});
      else mapped(e,'native flags with scoped biological correspondence');
    }
    else if(key in toggles){integer(e,0,1);if(n)ability(e,toggles[key]);else mapped(e,'disabled in fresh definition');}
    else if(key==='DeathBlow'){
      const chance=integer(e,0,100),requirement=policy(e,'era-death-blow-crt',{sourceId:options.sourceCreatureId,operation:'deathBlowCRT',chance},'Source calls CRT rand()%100+1 without native combat-ability bias; explicit actor and runtime operation binding required');
      // Generic validate callbacks cannot bypass the source-actor/operation contract.
      requirement.bound=false;delete requirement.binding;
      if(options.deathBlowCRT){try{const binding=requireSourceDeathBlowBinding(options.deathBlowCRT,{sourceId:options.sourceCreatureId,kind:'cfg',nativeExperienceProfile:options.nativeExperienceProfile});requirement.bound=true;requirement.binding=binding;ability(e,'DOUBLE_DAMAGE_CHANCE',chance);}catch(error){issue(e,'INVALID_DEATH_BLOW_BINDING',error.message);}}
    }
    else if(key in scalar)ability(e,scalar[key],integer(e,0));
    else if(key==='Fearless'){
      integer(e,0,1);
      if(n)ability(e,'FEARFUL',0,undefined,{valueType:'INDEPENDENT_MIN'});
      else mapped(e,'disabled in fresh definition');
    }
    else if(key==='Fire shield'){
      if(n<0||n>1)issue(e,'OUT_OF_RANGE','Fire shield fraction must be 0..1');
      ability(e,'FIRE_SHIELD',n*100);
    }
    else if(key==='AlwaysPositiveMorale'||key==='AlwaysPositiveLuck'){
      integer(e,0,1);if(n&&key==='AlwaysPositiveMorale'&&options.nativePositiveMoraleContract===SOURCE_TEMPLAR_MORALE_CONTRACT){
        definition.abilities.sourcePositiveMorale=compileSourceTemplarMorale(text,{sourceId:options.sourceCreatureId,contract:options.nativePositiveMoraleContract});mapped(e,'source positive morale floor1 before suppression');
      }else if(n)policy(e,'era-positive-'+(key.endsWith('Morale')?'morale':'luck'),{enabled:true},'Hooks select original executable branches; source does not establish numerical floor or reduction ordering',{lines:[4949,5043]});else mapped(e,'disabled in fresh definition');
    }
    else if(key==='SpellsCostLess'||key==='SpellsCostDump')policy(e,'era-spell-cost',{property:key,value:integer(e,0,255)},'SpellsCostDump takes army maximum outside native battle scope; SpellsCostLess overwrites ERA routine locals, native battle max aggregation needs executable proof',{lines:[5173,5231]});
    else if(key==='Sktransformer')ability(e,'SKELETON_TRANSFORMER_TARGET',0,resolve(e,'Creature',integer(e,0)));
    else if(key==='UpgradesTo'){definition.upgrades=[resolve(e,'Creature',integer(e,0))];mapped(e,'creature.upgrades');}
    else if(key==='Resistance effect'){
      const id=integer(e,0,20);
      const resistance={0:20,1:40,9:60,10:80,11:100};
      if(id in resistance)ability(e,'MAGIC_RESISTANCE',resistance[id]);
      else if([2,3,4,12,13].includes(id))policy(e,'era-resistance-selector',{selector:id,name:enumNames[key][id],legacyNativeShortcutRejected:true},'Original spell-level, positivity, level-zero and ability eligibility require scoped binary proof. In particular selector4 blocks more than native LEVEL_SPELL_IMMUNITY5.');
      else if(id===8)mapped(e,'default resistance selector; no intrinsic ability');
      else policy(e,'era-resistance-selector',{selector:id,name:enumNames[key][id]},'Selector redirects executable spell eligibility; elemental creature immunities are not broad spell-school immunity');
    }
    else if(key in enumNames){
      const id=integer(e,0,enumNames[key].length-1);
      policy(e,'era-'+key.replaceAll(' ','-'),{selector:id,name:enumNames[key][id]},'Jump-table behavior and chance/power defaults must be ported from the selected ERA routine');
    }
    else if(key.startsWith('ImposedSpell')){
      const slot=Number(key.match(/^ImposedSpell(\d)/)?.[1]);
      if(key.endsWith('Level')){
        integer(e,0,3);
        if(!values.has(`ImposedSpell${slot}Number`))issue(e,'INCOMPLETE_GROUP','Missing imposed spell number');
        else mapped(e,'included in imposed spell slot');
      }else{
        const spell=resolve(e,'Spell',integer(e,0,127));
        const levelEntry=values.get(`ImposedSpell${slot}Level`);
        if(!levelEntry)issue(e,'INCOMPLETE_GROUP','Missing imposed spell level');
        else policy(e,'era-imposed-spell',{slot,spell,mastery:integer(levelEntry,0,3),duration:1000},'ERA applies for 1000 rounds on creation and new-round reset; native ENCHANTED uses 50 rounds and is not exact',{lines:[4359,4400]});
      }
    }
    else if(key==='RegenerationHitPoints'||key==='RegenerationChance'){
      integer(e,0,key.endsWith('Chance')?100:2147483647);
      if(key==='RegenerationHitPoints'){
        const chance=values.get('RegenerationChance');
        if(!chance)issue(e,'INCOMPLETE_GROUP','Missing RegenerationChance');
        else policy(e,'era-regeneration',{hitPoints:n,chance:integer(chance,0,100),rollInclusive:[0,99],comparison:'roll < chance',combination:'max(creature,stack)'},'Native regeneration lacks per-stack chance and exact max aggregation',{lines:[5106,5128]});
      }else if(!values.has('RegenerationHitPoints'))issue(e,'INCOMPLETE_GROUP','Missing RegenerationHitPoints');
      else mapped(e,'included in regeneration policy');
    }
    else if(key==='isConstruct'&&mithrilGolem){ability(e,'ERA_SOURCE_CONSTRUCT');}
    else if(key==='ResGen_Type'||key==='ResGen_Amount'||key==='ResGen_Tax'){
      integer(e,0,key==='ResGen_Type'?7:2147483647);
      policy(e,'era-daily-resource-generation',{property:key,value:n},'Each own-player OnEveryDay: max amount per resource over owned hero armies and eligible town armies; additive Tax*count gold; no stack count multiplier on amount',{file:'Amethyst2/amethyst/dllmain.cpp',lines:[410,480,1314]});
    }
    else if(key==='CastsSpell'||key==='ACAST_CUSTOM_Spell'||/^After(?:Melee|Shoot|Defend|Wound)Spell2?$/.test(key)){
      policy(e,'era-spell-event',{property:key,spell:resolve(e,'Spell',integer(e,0,127))},'Different active/after-action/retaliation source roles, target, mastery, power and second-slot gating must be retained');
    }
    else if(/^CreatureMimicArtifact2?$/.test(key))policy(e,'era-creature-artifact',{property:key,artifact:resolve(e,'Artifact',integer(e,0))},'Creature-origin artifact effects need an explicit scope-aware artifact adapter');
    else if(key==='Demonology')policy(e,'era-demonology',{creature:resolve(e,'Creature',integer(e,0))},'Custom demon summoning target, power and dead-stack eligibility require native runtime port');
    else if(key==='Self-resurrection'||key.startsWith('rebirth ')){
      if(n<0||n>1)issue(e,'OUT_OF_RANGE','Expected 0..1 fraction');
      policy(e,'era-rebirth',{property:key,value:n},'Use HP truncation then minimum whole-creature rule and usage charges; native REBIRTH stochastic rounding differs',{lines:[4056,4115]});
    }
    else {
      const floating=['GhostFraction','ShootingResistance'].includes(key);
      if(!floating)integer(e);
      policy(e,'era-property-'+key,{value:n},'Parser and property provenance retained; hook behavior requires verified implementation, not guessed numeric bonus');
    }
  }
  if(!options.analyseOnly){
    for(const p of policies)if(!p.bound)diagnostics.push({source:options.source??'<cfg>',line:1,key:p.keys[0],code:'UNBOUND_RUNTIME_POLICY',message:p.kind});
    if(options.sourceBinaryParity!==true)diagnostics.push({source:options.source??'<cfg>',line:1,code:'SOURCE_BINARY_PARITY_UNVERIFIED',message:'The source revision has not been proved equivalent to the shipped TUM plugin'});
  }
  if(diagnostics.length)throw new CreaturePropertyError(diagnostics);
  return {definition,policies,mappings,ready:policies.every(p=>p.bound)&&options.sourceBinaryParity===true,provenance};
}

/** Reference implementation of Daily_Res, suitable for native adapter tests.
 * Caller supplies already enumerated eligible own-player armies exactly once.
 * Empty negative-count/type slots are excluded as source does; zero count is not.
 */
export function dailyCreatureResources(armies,properties){
  const resources=Array(8).fill(0);let tax=0;
  for(const army of armies)for(const stack of army){
    if(stack.count<0||stack.creature<0)continue;
    const p=properties[stack.creature]??{};
    tax+=(p.ResGen_Tax??0)*stack.count;
    const r=p.ResGen_Type??0;if(r<0||r>7)continue;
    resources[r]=Math.max(resources[r],p.ResGen_Amount??0);
  }
  resources[6]+=tax;return resources;
}
