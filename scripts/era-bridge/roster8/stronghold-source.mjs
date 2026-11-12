/** Whole original eighth Stronghold family. Runtime activation remains gated
 * by native battle controls, not just by declarative CFG/XP compilation. */
export const SOURCE_STRONGHOLD_CONTRACT='source-stronghold-creature-spell-immunity-v1';
export function reviewedStronghold(text,{sourceId,contract}={}){
 if(contract!==SOURCE_STRONGHOLD_CONTRACT||![275,283].includes(sourceId))throw Error('Explicit reviewed Stronghold source contract required');
 const expected=sourceId===275?{Flags:19,Level:5,Town:6,UpgradesTo:283}:{Flags:19,Level:5,Town:6};
 const entries=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>{
  const match=/^([^=]+)=(-?\d+)$/.exec(l);if(!match)throw Error('Unreviewed Stronghold CFG field');return [match[1],Number(match[2])];
 });
 if(new Set(entries.map(([k])=>k)).size!==entries.length||JSON.stringify(Object.fromEntries(entries))!==JSON.stringify(expected))throw Error('Original Stronghold CFG changed');
 return {sourceId,contract,immuneToSourceCreatureEvents:sourceId===283,
  sourceOnlyDamageOrigins:sourceId===283?['DeathStare','secondaryDeathCloud','FireShield','secondaryFireball','Acid','Thunder','DeathRipple']:[],
  postActionCleanse:sourceId===283?[42,52,45,54,50,62,59,60,61,70,71,72,73,74,75]:[],
  scope:'Source global OnMonsterPhysicalDamage and OnBattleActionEnd; hero debuffs are removed after their action as well. Ordinary hero spell damage and primary Lich/Magog hits remain.',
  nativeValidationRequired:true};
}
