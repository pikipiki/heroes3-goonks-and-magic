/** Whole339 source opt-in; does not activate or assert native gameplay validation. */
export const SOURCE_SULFIDE_CONTRACT='source-sulfide-dragon-v1';
export const SULFIDE_REGENERATION=Object.freeze([0,0,0,0,25,50,75,125,250,250,250]);
const fields={ResGen_Type:3,ResGen_Amount:1,Flags:-2147483493,Level:6,'Spell effect':8,'Attack effect':4,'Resistance effect':15,Fearless:1,Sktransformer:68,Poison:100,Aging:100,Paralyze:100,ParalyzeChance:3,isHellHydra:1};
export function reviewedSulfide(text,{sourceId,contract,resolveSpell}={}){
 if(sourceId!==339||contract!==SOURCE_SULFIDE_CONTRACT)throw Error('Explicit whole339 contract required');
 const rows=text.trim().split(/\r?\n/).map(l=>l.split('=').map(s=>s.trim()));
 if(rows.length!==Object.keys(fields).length||new Set(rows.map(([k])=>k)).size!==rows.length||rows.some(([k,v])=>!Object.hasOwn(fields,k)||Number(v)!==fields[k]))throw Error('Unreviewed source339 CFG');
 const abilities={};for(const spell of[71,73,74,80]){const key=resolveSpell?.(spell);if(!key?.includes(':'))throw Error('Unresolved Toxic15 spell'+spell);abilities['sourceToxic'+spell]={type:'SPELL_IMMUNITY',subtype:key,val:0};}
 return{abilities,consumedKeys:['ResGen_Type','ResGen_Amount','Spell effect','Attack effect','Resistance effect','Poison','Aging','Paralyze','ParalyzeChance','isHellHydra'],featurePolicy:{schemaVersion:1,creature:'tum-era:eraCreature339'},runtime:{dailyResources:{resource:'core:sulfur',amount:1,goldPerCreature:0}},source:{statusPower:100,statusMastery:1,paralysisRoll:'3>Randint(0,100)',acidProc:'Randint(1,19)<=20, consumed even guaranteed',regeneration:{chancePercent:50,values:[...SULFIDE_REGENERATION]},scope:'Primary6/7 and normalretal only; no genericintrinsicAge eligibility substitution'}};
}
