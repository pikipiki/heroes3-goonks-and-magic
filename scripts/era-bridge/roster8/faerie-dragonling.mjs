/** Exact source343; shares the verified original Faerie pool, not258 biology. */
import{SOURCE_FAERIE_POOL}from'./primal-faerie.mjs';
export const SOURCE_FAERIE_DRAGONLING_CONTRACT='source-faerie-dragonling-v1';
const fields={DoNotGenerate:1,Flags:-2147483501,Level:4,'Spell 1':8,'Spell 2':7,'Spell 3':2,CreatureSpellPowerAdder:1,isAimedCaster:1,isFaerie:1};
export function reviewedFaerieDragonling(text,{sourceId,contract,resolveSpell}={}){
 if(sourceId!==343||contract!==SOURCE_FAERIE_DRAGONLING_CONTRACT)throw Error('Explicit whole source343 contract required');
 const entries=text.trim().split(/\r?\n/).map(l=>l.split('=').map(s=>s.trim()));if(entries.length!==Object.keys(fields).length||new Set(entries.map(([k])=>k)).size!==entries.length||entries.some(([k,v])=>!Object.hasOwn(fields,k)||Number(v)!==fields[k]))throw Error('Unreviewed Faerie Dragonling CFG');
 const abilities={sourceFaeriePower:{type:'CREATURE_SPELL_POWER',val:100}};
 for(const{spell,weight}of SOURCE_FAERIE_POOL){const subtype=resolveSpell?.(spell);if(typeof subtype!=='string'||!subtype.includes(':'))throw Error('Exact native spell resolver required');abilities['sourceFaerieCast'+spell]={type:'SPELLCASTER',subtype,val:2,addInfo:weight};}
 return{abilities,consumedKeys:Object.keys(fields).filter(k=>!['DoNotGenerate','Flags','Level'].includes(k)),featurePolicy:{schemaVersion:1,creature:'tum-era:eraCreature343'},source:{spellPoolAddress:'h3era63B850',spellPool:SOURCE_FAERIE_POOL,activePower:'currentCount+1',mastery:2,randomExclusion:'source-random-exclusion-v1 required independently',target:'Same mode8/7/2 and isAimedCaster as validated258/356; selected actual spell, no probability roll at target acceptance'}};
}
