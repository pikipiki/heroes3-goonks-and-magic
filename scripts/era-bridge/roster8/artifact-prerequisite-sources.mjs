/** Strict source review only: no incomplete actor is a native definition. */
import{parseCreatureProperties}from'../creatures/creature-properties.mjs';
export const ARTIFACT_PREREQUISITES_REVIEW_CONTRACT='source-artifact-prerequisites-review-v1';
export const ARTIFACT_PREREQUISITE_IDS=Object.freeze([339,343,344,346,347]);
const expected={
339:{ResGen_Type:3,ResGen_Amount:1,Flags:-2147483493,Level:6,'Spell effect':8,'Attack effect':4,'Resistance effect':15,Fearless:1,Sktransformer:68,Poison:100,Aging:100,Paralyze:100,ParalyzeChance:3,isHellHydra:1},
343:{DoNotGenerate:1,Flags:-2147483501,Level:4,'Spell 1':8,'Spell 2':7,'Spell 3':2,CreatureSpellPowerAdder:1,isAimedCaster:1,isFaerie:1},
344:{DoNotGenerate:1,Flags:-2147483501,Level:4,'Spell effect':8},
346:{DoNotGenerate:1,AfterMeleeSpell:22,AfterDefendSpell:29,AfterActionSpellMastery:3,AfterMeleeSpell2:22,AfterDefendSpell2:29,Flags:-2147467109,Level:6,'Resistance effect':4,'Spell 1':10,'Spell 2':7,'Spell 3':2,CreatureSpellPowerMultiplier:5,CreatureSpellPowerAdder:60,CastsSpell:22,Fear:1,Fearless:1,hasFirewall:1,Sktransformer:254,'Fire shield':0.3},
347:{DoNotGenerate:1,AfterMeleeSpell:20,AfterDefendSpell:20,AfterActionSpellMastery:3,AfterMeleeSpell2:16,AfterDefendSpell2:20,Flags:-2013265765,Level:6,'Resistance effect':4,'Spell 1':10,'Spell 2':7,'Spell 3':2,CreatureSpellPowerMultiplier:10,CreatureSpellPowerAdder:90,CastsSpell:16,Fear:1,Fearless:1,Sktransformer:254,MovesTwice:1}
};
const pending={339:['TOXIC resistance selector15 exact gates','Spell effect8 ACID and Attack effect4 DISRUPT ordering','Poison/Aging/Paralyze selectors and ParalyzeChance3','isHellHydra forces ATT_DISRUPT RNG1..19 via756D0F; not an attack-area flag','daily resource3/amount1 owner/type proof','XP regeneration50% rank schedule and HATE source targets102/103/244'],343:['Faerie pool with currentcount+1 power','isAimedCaster primary/AI/manual target semantics','original no-random-generation selection exclusion'],344:['Spell effect8 ACID chance, DEF reduction/damage and sequencing','original no-random-generation selection exclusion'],346:['MAGICIMMUNE selector4 full source semantics','active mode10/7/2 Inferno22 count*5+60','double AfterMeleeInferno22 and double AfterDefendFireShield29 mastery3 ordering','hasFirewall obstacle entry behavior','Fear and exact30% FireShield float32 behavior','XP p21/a13 current-active dynamic power and obstacle targeting'],347:['source flags bit27 initial DEFENDING state and +4DC lifecycle','MAGICIMMUNE selector4 full source semantics','active mode10/7/2 IceBolt16 count*10+90','AfterMelee20 then16, AfterDefend20 twice mastery3 ordering','MovesTwice turn state and Fear','XP p16/a20 current-active dynamic power']};
export function reviewArtifactPrerequisite(text,{sourceId,contract}={}){
 if(contract!==ARTIFACT_PREREQUISITES_REVIEW_CONTRACT||!ARTIFACT_PREREQUISITE_IDS.includes(sourceId))throw Error('Explicit review-only artifact prerequisite contract required');
 const rows=parseCreatureProperties(text),wanted=expected[sourceId];if(rows.length!==Object.keys(wanted).length||rows.some(r=>!Object.hasOwn(wanted,r.key)||Number(r.rawValue)!==wanted[r.key]))throw Error('Unreviewed artifact prerequisite CFG '+sourceId);
 return {sourceId,fields:{...wanted},complete:false,nativeValidated:false,activationAllowed:false,pendingMechanics:[...pending[sourceId]]};
}
