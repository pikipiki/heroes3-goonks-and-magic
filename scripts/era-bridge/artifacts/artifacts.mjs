/** Independent semantic translation; provenance is in inventory.json. No ERA code is embedded. */
export const COMBINATIONS = Object.freeze({
  219:[86,87,88,89],181:[57,58,59],180:[66,67,68],179:[115,116,117],238:[79,80,81,82],258:[23,11,29,17],
  182:[171,172,173,174],232:[128,235,236,237],259:[175,176,177,178],278:[273,274,276,277],
});
export const SPECIALS = Object.freeze({
  179:['goldenGoose'],180:['diplomatCloakLegacy'],181:['reflection'],183:['enemyMorale2'],184:['enemyLuck2'],
  185:['enemyLuck1'],186:['enemyMorale1'],187:['enemyLuck1'],188:['enemyMorale1'],
  197:['elementalExclusivity'],220:['lightningRod'],238:['orbChaos'],249:['enemyLuck3'],250:['enemyMorale2'],
  252:['enemyMorale3','enemyLuck3'],259:['hydraQueen'],260:['wayfarer'],261:['exchangeCloak'],
  262:['massResurrection'],263:['massImplosion'],264:['equalAttackDefense'],265:['equalPowerKnowledge'],
  266:['hornAbyss'],268:['oblivion'],269:['interference10'],270:['interference10'],271:['interference25'],
});
const PRIMARY={Attack:'primarySkill.attack',Defence:'primarySkill.defence',Spellpower:'primarySkill.spellpower',Knowledge:'primarySkill.knowledge'};
const SIMPLE={Morale:'MORALE',Luck:'LUCK',Health:'STACK_HEALTH',Shots:'SHOTS',Casts:'CASTS',RegenerateSpellpoints:'MANA_REGENERATION'};
const fixedSets={14:[2,3,5],15:[0,1,2,3,4,5,6,7,8,9],16:[63,8,9],17:[66,67,68,69],18:[24,39],19:[25,37,38,40],20:[16,20]};
export function propertyKind(key) {
  if(PRIMARY[key]||SIMPLE[key]||['DamageMin','DamageMax','Immunities','GivesSpell','GivesSpellSet'].includes(key)||/^Autospell([2-9])?$/.test(key))return 'native';
  if(/^Autosummon([2-9])?(Power)?$/.test(key)||/^Upgrade(From|To)([2-9])?$/.test(key))return 'adapter';
  if(key==='AI_Properties')return 'ai-adapter';
  return 'unsupported';
}
export function parseArtifactCfg(text,{source='<cfg>',duplicates='reject'}={}) {
  const entries=[],diagnostics=[],seen=new Map();
  for(const [i,line] of text.replace(/^\uFEFF/,'').split(/\r?\n/).entries()) {
    const s=line.trim(); if(!s||/^(;|#|\/\/)/.test(s))continue;
    const m=/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(s);
    const at={source,line:i+1};
    if(!m){diagnostics.push({...at,code:'syntax',message:'Expected key=value'});continue;}
    const [,key,raw]=m,kind=propertyKind(key);
    if(kind==='unsupported'){diagnostics.push({...at,code:'unknown-property',key});continue;}
    let value;
    if(key==='AI_Properties') {
      if(!/^"-?\d+(?:\s+-?\d+)*"$/.test(raw)) {diagnostics.push({...at,code:'invalid-ai-properties',key});continue;}
      value=raw.slice(1,-1).split(/\s+/).map(Number);
    } else if(key==='Immunities') {
      if(!/^\d+(?:\s*,\s*\d+)*$/.test(raw)){diagnostics.push({...at,code:'invalid-spell-list',key});continue;}
      value=raw.split(',').map(Number);
    } else {
      if(!/^-?\d+$/.test(raw)||!Number.isSafeInteger(Number(raw))||Number(raw)<-2147483648||Number(raw)>2147483647){diagnostics.push({...at,code:'invalid-integer',key});continue;}
      value=Number(raw);
      if(PRIMARY[key]&&(value < -128 || value > 127)){diagnostics.push({...at,code:'primary-skill-byte-overflow',key});continue;}
    }
    if(seen.has(key)) {
      if(duplicates!=='emerald-first')diagnostics.push({...at,code:'duplicate-property',key,firstLine:seen.get(key)});
      else diagnostics.push({...at,code:'shadowed-property',severity:'warning',key,firstLine:seen.get(key),message:'Emerald ParseInt/ParseTuple uses first strstr occurrence; this assignment has no effect.'});
      continue;
    }
    seen.set(key,i+1);entries.push({...at,key,value,kind});
  }
  return {entries,diagnostics};
}
function resolve(resolver,kind,id,at,diagnostics) {
  const value=resolver?.(id);
  if(typeof value!=='string'||!value.length){diagnostics.push({...at,code:'unresolved-id',kind,id});return null;}
  return value;
}
/** Emits an artifact PATCH. Metadata/assets/slot/value and any pre-existing effects must be supplied by caller.
 * Native output is withheld if ANY adapter is needed but unbound. Adapter descriptors are data, never claims of engine support.
 * authorizeAdapters is for callers which really bind these exact policy contracts, not a permissive ignore switch.
 */
export function compileArtifact({id,text='',source=`${id}.cfg`,resolveSpell,resolveCreature,resolveArtifact,
  duplicates='reject',authorizeAdapters=[],aiPolicy='require-era-equivalence',spellCatalogue,fixedPowerOpeningSpellContract,includeSpecials=true,includeCombination=true}={}) {
  if(!Number.isSafeInteger(id)||id<0)throw new TypeError('A nonnegative integer artifact id is required');
  if(fixedPowerOpeningSpellContract!==undefined&&!['source-fixed50-global-v1','source-fixed50-mine-v1','source-mass-hypnotize253-v1'].includes(fixedPowerOpeningSpellContract))throw new TypeError('Unknown source opening spell contract');
  if(!['require-era-equivalence','native-vcmi'].includes(aiPolicy))throw new TypeError('Unknown artifact AI policy');
  const aiDecisions=[];
  const parsed=parseArtifactCfg(text,{source,duplicates}),diagnostics=[...parsed.diagnostics],bonuses={},adapters=[];
  const add=(key,type,val,extra={})=>{bonuses[key]={type,...(val===undefined?{}:{val}),...extra};};
  const fields=new Map(parsed.entries.map(e=>[e.key,e]));
  for(const entry of parsed.entries) {
    const {key,value}=entry;
    if(PRIMARY[key])add(key,'PRIMARY_SKILL',value,{subtype:PRIMARY[key]});
    else if(SIMPLE[key])add(key,SIMPLE[key],value);
    // Emerald sums actual worn copies. Preserve each leaf instance's shared type-bonus path.
    else if(key==='DamageMin'||key==='DamageMax')add(key,'CREATURE_DAMAGE',value,{subtype:key==='DamageMin'?'creatureDamageMin':'creatureDamageMax',...(id>=273&&id<=277?{stacking:'ALWAYS'}:{})});
    else if(key==='Immunities')for(const spell of new Set(value)) {
      const subtype=resolve(resolveSpell,'spell',spell,entry,diagnostics);
      if(subtype)add(`immunity${spell}`,'SPELL_IMMUNITY',undefined,{subtype});
    }
    else if(/^Autospell/.test(key)) {
      if(value<0)diagnostics.push({...entry,code:'invalid-spell-id'});
      else if(value!==0){const subtype=resolve(resolveSpell,'spell',value,entry,diagnostics),autocastIndex=key==='Autospell'?0:Number(key.slice('Autospell'.length))-1;
        if(id===253&&value===60&&fixedPowerOpeningSpellContract==='source-mass-hypnotize253-v1')add(key,'OPENING_BATTLE_SPELL',50,{subtype,addInfo:[3,autocastIndex]});
        else if(([24,25].includes(value)&&fixedPowerOpeningSpellContract==='source-fixed50-global-v1')||(value===11&&fixedPowerOpeningSpellContract==='source-fixed50-mine-v1'))add(key,'ERA_FIXED_POWER_OPENING_SPELL',50,{subtype,addInfo:[3,autocastIndex]});
        else if([11,24,25,60].includes(value))adapters.push({kind:'artifactFixedPowerOpeningSpell',spell:subtype,eraSpell:value,schoolLevel:3,sourceArgument:50,source:'Emerald emerald.cpp:151-159; resolve fixed-power/targeting semantics before binding',reason:'Native OPENING_BATTLE_SPELL sets duration only; source last argument may fix spell power, and Hypnotize auto-targeting differs.'});
        else if(subtype)add(key,'OPENING_BATTLE_SPELL',50,{subtype,addInfo:[3,autocastIndex]});}
    } else if(key==='GivesSpell') {
      if(value<0||value>127)diagnostics.push({...entry,code:'invalid-spell-id'});
      else {const subtype=resolve(resolveSpell,'spell',value,entry,diagnostics);if(subtype)add(key,'SPELL',0,{subtype});}
    } else if(key==='GivesSpellSet') {
      // Emerald gives explicit single spell precedence over a spell set.
      if(fields.has('GivesSpell'))continue;
      let spells=fixedSets[value];
      if(value>=9&&value<=12) {
        if(!Array.isArray(spellCatalogue))diagnostics.push({...entry,code:'missing-spell-catalogue',message:'Provide original ERA spell ids/levels to preserve the source 0..69 boundary.'});
        else spells=spellCatalogue.filter(s=>s.id>=0&&s.id<70&&s.level===value-8).map(s=>s.id);
      }else if(value===13)spells=Array.from({length:70},(_,i)=>i);
      if(!spells)diagnostics.push({...entry,code:'unknown-spell-set',id:value});
      else for(const spell of spells){const subtype=resolve(resolveSpell,'spell',spell,entry,diagnostics);if(subtype)add(`givenSpell${spell}`,'SPELL',0,{subtype});}
    }else if(key==='AI_Properties'){
      if(aiPolicy==='native-vcmi')aiDecisions.push({policy:aiPolicy,source,line:entry.line,eraTokens:value,semantics:'Native VCMI artifact bonus valuation; ERA heuristic vector parity is not claimed',evidence:'AI/Nullkiller2/AIUtility.cpp:getArtifactBonusScoreImpl/getPotentialArtifactScore/getArtifactScoreForHero'});
      else adapters.push({kind:'artifactAiValuation',source,lines:[entry.line],tokens:value});
    }
  }
  const summons=[];const upgrades=[];
  for(let i=1;i<=9;i++) {
    const suffix=i===1?'':i,creature=fields.get(`Autosummon${suffix}`),power=fields.get(`Autosummon${suffix}Power`);
    if(power&&!creature)diagnostics.push({...power,code:'orphan-summon-power'});
    if(creature) {
      if(creature.value<0){if(creature.value!==-1)diagnostics.push({...creature,code:'invalid-creature-id'});}
      else {const target=resolve(resolveCreature,'creature',creature.value,creature,diagnostics);if(target)summons.push({creature:target,power:power?.value??0,sourcePower:power?.value??0,index:i});}
    }
    const from=fields.get(`UpgradeFrom${suffix}`),to=fields.get(`UpgradeTo${suffix}`);
    if(!!from!==!!to)diagnostics.push({...(from??to),code:'unpaired-upgrade'});
    if(from&&to){const a=resolve(resolveCreature,'creature',from.value,from,diagnostics),b=resolve(resolveCreature,'creature',to.value,to,diagnostics);if(a&&b)upgrades.push({from:a,to:b,index:i});}
  }
  if(summons.length)adapters.push({kind:'artifactOpeningSummons',summons,schoolLevel:0,power:'p<0 ? trunc(-p*heroPower/1000) : p===0 ? heroPower : p; replace zero with one',order:'equipment slot 0..18 then summon index 1..9; before artifact opening spells',preserveElementalSummonState:true,source:'Emerald emerald.cpp:133-148; events.cpp:26-46'});
  if(upgrades.length)adapters.push({kind:'artifactDailyConversions',upgrades,cost:0,order:'equipment slot 0..18 then pair 1..9 then army slot 0..6; immediate in-place, therefore chains can occur',source:'Emerald events.cpp:303-308'});
  if(includeSpecials)for(const kind of SPECIALS[id]??[])adapters.push({kind,artifactId:id,source:'TUM Data/s/Third Upgrade Mod.erm:1113-2040; see special-policies.json'});
  let components;
  if(includeCombination&&COMBINATIONS[id])components=COMBINATIONS[id].map(n=>resolve(resolveArtifact,'artifact',n,{source,line:0},diagnostics));
  const bound=new Set(authorizeAdapters);
  for(const adapter of adapters)if(!bound.has(adapter.kind))diagnostics.push({source,code:'unbound-runtime-adapter',kind:adapter.kind});
  const ok=!diagnostics.some(d=>d.severity!=='warning');
  return {id,ok,aiDecisions,patch:ok?{bonuses,...(components?{components}: {})}:null,nativePreview:{bonuses,...(components?.every(Boolean)?{components}:{})},adapters,diagnostics,properties:parsed.entries};
}
/** Assemble a complete VCMI document from verified caller metadata and resolved assets.
 * This function validates essential fields, but caller remains responsible for documenting
 * native ERA id-specific effects that do not appear in cfg. Existing bonuses cannot collide.
 */
export function compileArtifactDefinition(options) {
  const {baseArtifact,resolveAssets,...compileOptions}=options;
  const c=compileArtifact(compileOptions),diagnostics=[...c.diagnostics];
  const base=baseArtifact&&structuredClone(baseArtifact);
  if(!base)diagnostics.push({code:'missing-base-artifact'});
  else {
    if(!Array.isArray(base.type)||!base.type.length||base.type.some(v=>!['HERO','CREATURE','COMMANDER'].includes(v)))diagnostics.push({code:'invalid-artifact-type'});
    if(!['SPECIAL','TREASURE','MINOR','MAJOR','RELIC'].includes(base.class))diagnostics.push({code:'invalid-artifact-class'});
    if(!Number.isFinite(base.value)||base.value<0)diagnostics.push({code:'invalid-artifact-value'});
    for(const key of ['name','description','event'])if(typeof base.text?.[key]!=='string')diagnostics.push({code:'missing-artifact-text',key});
    const graphics=resolveAssets?.(options.id)??base.graphics;
    if(!graphics||['image','map','scenarioBonus'].some(k=>typeof graphics[k]!=='string'||!graphics[k]))diagnostics.push({code:'unresolved-artifact-assets'});
    else base.graphics=graphics;
    for(const key of Object.keys(c.patch?.bonuses??{}))if(base.bonuses?.[key])diagnostics.push({code:'bonus-name-collision',key});
    if(base.components&&c.patch?.components&&JSON.stringify(base.components)!==JSON.stringify(c.patch.components))diagnostics.push({code:'combination-conflict'});
  }
  const ok=!diagnostics.some(d=>d.severity!=='warning');
  return {...c,ok,diagnostics,definition:ok?{...base,...c.patch,bonuses:{...base.bonuses,...c.patch.bonuses}}:null};
}
