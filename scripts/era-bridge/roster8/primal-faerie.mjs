/** Whole original258 contract; native power/defend/absorption services are mandatory. */
export const SOURCE_PRIMAL_FAERIE_CONTRACT='source-primal-faerie-v1';
const fields={AfterDefendSpell:27,AfterDefendSpell2:28,Flags:-2147483501,Level:6,'Resistance effect':20,'Vulnerability effect':9,'Spell 1':8,'Spell 2':7,'Spell 3':2,CreatureSpellPowerMultiplier:10,CreatureSpellPowerAdder:1,isAimedCaster:1,isFaerie:1,Sktransformer:68};
export const SOURCE_FAERIE_POOL=Object.freeze([[16,22],[17,22],[21,21],[15,10],[20,10],[19,5],[23,5],[22,5]].map(([spell,weight])=>Object.freeze({spell,weight})));
export const SOURCE_DEBUFF_IMMUNITIES=Object.freeze([42,45,47,50,52,54,61,62,70,71,72,73,74,75,76,77,78]);
export function reviewedPrimalFaerie(text,{sourceId,contract,resolveSpell}={}){
 if(sourceId!==258||contract!==SOURCE_PRIMAL_FAERIE_CONTRACT)throw Error('Explicit whole source258 contract required');
 const entries=text.trim().split(/\r?\n/).map(line=>line.split('=').map(v=>v.trim()));
 if(entries.length!==Object.keys(fields).length||new Set(entries.map(([key])=>key)).size!==entries.length||entries.some(([key,value])=>fields[key]===undefined||Number(value)!==fields[key]))throw Error('Unreviewed Primal Faerie CFG');
 const spell=id=>{const key=resolveSpell?.(id);if(typeof key!=='string'||!key.includes(':'))throw Error('Exact native spell resolver required for '+id);return key;};
 const abilities={sourceFaeriePower:{type:'CREATURE_SPELL_POWER',val:1000}};
 for(const{spell:id,weight}of SOURCE_FAERIE_POOL)abilities['sourceFaerieCast'+id]={type:'SPELLCASTER',subtype:spell(id),val:2,addInfo:weight};
 for(const id of SOURCE_DEBUFF_IMMUNITIES)abilities['sourceDebuffImmunity'+id]={type:'SPELL_IMMUNITY',subtype:spell(id)};
 return {abilities,consumedKeys:Object.keys(fields).filter(k=>!['Flags','Level','Sktransformer'].includes(k)),runtimeServices:{spellDamageInversion:{}},featurePolicy:{schemaVersion:1,creatures:['tum-era:eraCreature258']},source:{spellPoolAddress:'h3era63B850',spellPool:SOURCE_FAERIE_POOL,activePower:'currentCount*10+1',mastery:2,afterDefend:[27,28],absorption:'negative floor(incomingMagicalDamage/4)',immunities:SOURCE_DEBUFF_IMMUNITIES,spell3:'Original AI scoring selector2 recorded; native AI evaluates the same chosen spell'}};
}
