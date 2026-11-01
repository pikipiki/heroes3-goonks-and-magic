import {ObjectBridgeError} from './objects.mjs';
const fail=(code,message,details)=>{throw new ObjectBridgeError(code,message,details);};
const keys=(value,allowed)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.includes(k)))fail('UNSUPPORTED_SPELL_FILTER','Unexpected source filter fields');};
const integer=(n,name,min=0,max=2147483647)=>{if(!Number.isSafeInteger(n)||n<min||n>max)fail('INVALID_FILTER_VALUE',`Invalid ${name}`,{n});return n;};
/** Exact source predicate evaluated against a COMPLETE original spell catalog.
 * Native anyOf intersects this fixed source set with the map's allowed spells.
 * TUM3.5 requests one random spell per affected state, so ERA uniqueness is
 * naturally preserved. Multi-spell generation is deliberately rejected.
 */
export function compileEraSpellFilters(spells,{spellCatalog,resolveSpell}={}){
 if(!Array.isArray(spells)||spells.length>1)fail('UNSUPPORTED_SPELL_UNIQUENESS','Only the original TUM single-spell states map exactly to native random spells');
 const output=[];
 for(const spell of spells){keys(spell,['id','bits']);
  if(Object.hasOwn(spell,'id')){const id=integer(spell.id,'spell id',-1);if(id===-1)continue;const native=resolveSpell?.(id);if(typeof native!=='string'||!native)fail('UNRESOLVED_SPELL','Explicit spell identity resolver required',{id});output.push(native);continue;}
  const bits=spell.bits||{};keys(bits,['levels','schools','flags']);
  const rawLevels=integer(bits.levels??0,'level mask'),rawSchools=integer(bits.schools??0,'school mask'),rawFlags=integer(bits.flags??0,'flags mask',-2147483648,4294967295);
  if(!rawLevels&&!rawSchools&&!rawFlags)continue;
  const levels=rawLevels?Math.max(2,Math.min(62,rawLevels)):62,schools=rawSchools?Math.max(1,Math.min(15,rawSchools)):15,flags=rawFlags?rawFlags>>>0:0xffffffff;
  if(!Array.isArray(spellCatalog)||!spellCatalog.length)fail('MISSING_SPELL_CATALOG','Complete original ERA spell catalog required; native level-only filters could include unrelated mod spells');
  const candidates=[];
  for(const entry of spellCatalog){
   // Shipped ERA extender0x100034D4: random candidate loop is IDs0..69.
   const eraId=integer(entry.eraId,'catalog spell id');if(eraId>=70)continue;
   const level=integer(entry.level,'catalog level',0,31),schoolBits=integer(entry.schoolBits,'catalog school mask',0,15),spellFlags=integer(entry.flags,'catalog flags',-2147483648,4294967295);
   if(!((flags&(spellFlags>>>0))&&(levels&(1<<level))&&(schools&schoolBits)))continue;
   if(entry.nativeSpecial)fail('NON_EQUIVALENT_SPECIAL_SPELL','ERA candidate is excluded by native special-spell filter',{eraId:entry.eraId});
   if(typeof entry.nativeId!=='string'||!entry.nativeId)fail('UNRESOLVED_SPELL','Candidate has no explicit native identity',{eraId:entry.eraId});
   candidates.push(entry.nativeId);
  }
  if(!candidates.length)fail('EMPTY_SPELL_CANDIDATES','Original filter has no mapped candidates');
  output.push({anyOf:[...new Set(candidates)].sort()});
 }
 return output;
}

/** Source ReadJsonInt accepts decimal strings; invalid positions retain default.
 * baseLayout is the caller-verified native equivalent of original bank layout,
 * including commander positions and wide-unit policy. No board-index offset.
 */
export function compileEraTroopPlacement(source,{layoutId,baseLayout}={}){
 keys(source,['isBank','attackers','defenders']);
 if(typeof source.isBank!=='boolean')fail('INVALID_TROOP_PLACEMENT','isBank must be boolean');
 if(typeof layoutId!=='string'||!layoutId||!baseLayout)fail('MISSING_BANK_LAYOUT','Explicit ID and verified base layout required');
 const layout=structuredClone(baseLayout);
 const positions=(entries,defaults)=>{
  if(!Array.isArray(entries)||entries.length!==7||!Array.isArray(defaults)||defaults.length!==7)fail('INVALID_TROOP_PLACEMENT','Seven source/default positions required');
  return entries.map((entry,i)=>{if(typeof entry!=='number'&&!(typeof entry==='string'&&/^[+-]?\d+$/.test(entry)))fail('INVALID_TROOP_PLACEMENT','Expected original decimal position',{entry});const n=Number(entry);integer(n,'position',-2147483648);return n>=1&&n<=186&&n%17!==0&&n%17!==16?n:defaults[i];});
 };
 layout.attackerUnits=positions(source.attackers,baseLayout.attackerUnits);
 layout.defenderUnits=positions(source.defenders,baseLayout.defenderUnits);
 if(source.isBank){layout.obstaclesAllowed=false;layout.tacticsAllowed=false;}
 else fail('UNSUPPORTED_NON_BANK_PLACEMENT','Non-bank ERA battle mode requires explicit native war-machine/tactics policy');
 return {layoutId,layout,settingsPatch:{combat:{layouts:{[layoutId]:layout}}}};
}

/** Input to the native EraBankAppearance hook. Original masks are intentionally
 * retained: ERA's SetMapItemDef copies object attributes before changing DEF.
 * Asset resolver verifies original DEF bytes exist and returns native path.
 */
export function compileEraAppearancePolicy(bank,{resolveAnimation}={}){
 if(!Array.isArray(bank.states)||bank.states.length<1||bank.states.length>4||!Array.isArray(bank.properties)||bank.properties.length!==1)fail('UNSUPPORTED_APPEARANCE_BASE','Exactly one original base template and1..4 states required');
 const base=bank.properties[0].trim().split(/\s+/)[0],chances=[],animations=[];
 const asset=name=>{const mapped=resolveAnimation?.(name);if(typeof mapped!=='string'||!mapped)fail('UNRESOLVED_BANK_ANIMATION','Original bank DEF must resolve',{name});return mapped;};
 for(let i=0;i<4;i++){
  const state=bank.states[i];chances.push(state?integer(state.chance,'state chance',0,100):0);
  if(state?.customDef!==undefined&&(typeof state.customDef!=='string'||!state.customDef))fail('INVALID_CUSTOM_DEF','customDef must be a nonempty DEF filename');
  animations.push(asset(state?.customDef||base));
 }
 return {chances,animations};
}

/** Proven common semantics: ERA generator ctor0x534640 stores value+0xC,
 * density+0x10.0x5468EC adds density to total;0x546979..0x5469A4 chooses by
 * cumulative density. VCMI TreasurePlacer uses rarity as cumulative probability
 * and value as treasure-budget cost. Eligibility/placement remains native RMG.
 */
export function compileEraBankRmg(bank){
 if(bank.enabled===false)fail('DISABLED_SOURCE_BANK','Disabled original bank cannot enter native random generation');
 const value=integer(bank.value,'ERA RMG value',1),rarity=integer(bank.density,'ERA RMG density',1,99999);
 return {value,rarity};
}
