/** Source-only Inferno eighth-family arithmetic evidence. This module neither
 * enables actors nor advertises a completed native runtime contract. */
export const INFERNO_SOURCE_IDS=Object.freeze([337,338]);
export function readInfernoSourceDefinition(text,sourceId){
 const expected=sourceId===337?{ShootingResistance:0.3,Flags:272,Level:6,Town:3,UpgradesTo:338}:sourceId===338?{ShootingResistance:0.3,Flags:273,Level:6,Town:3,'Spell 1':2,'Spell 2':0,'Spell 3':0,Demonology:217}:null;
 if(!expected)throw Error('Unreviewed Inferno actor');
 const fields=new Map();for(const line of text.split(/\r?\n/)){const m=/^([^=]+)=(.*)$/.exec(line.trim());if(!m)continue;if(fields.has(m[1]))throw Error('Duplicate source property');fields.set(m[1],Number(m[2]));}
 if(fields.size!==Object.keys(expected).length||Object.entries(expected).some(([k,v])=>fields.get(k)!==v))throw Error('Unreviewed Inferno source fields');
 return {sourceId,fields:Object.fromEntries(fields),complete:false,pendingNativeOperations:sourceId===337?['source-float32-ranged-resistance']:['source-float32-ranged-resistance','source-mode2-demon-summoning-217']};
}
/** tables.cpp937..986: source parses a float table, promotes to double for
 * multiplication, converts to int before StackBlockPartial. Shipped DLL
 *1001B75D..76F ADDSS/stored float,1001B7F7..816 CVTSS2SD/MULSD/CVTTSD2SI.
 * Stack additions
 * occur in float32; this function models that narrow stage, not final damage. */
export function sourceRangedResistanceInput(damage,{creatureResistance=0.3,stackResistance=0,lastAction=7}={}){
 if(!Number.isSafeInteger(damage)||damage<0||damage>0x7fffffff)throw Error('Source signed damage required');
 const resistance=Math.fround(Math.fround(creatureResistance)+Math.fround(stackResistance));
 return lastAction===7&&resistance!==0?Math.trunc(damage*(1-resistance)):damage;
}
