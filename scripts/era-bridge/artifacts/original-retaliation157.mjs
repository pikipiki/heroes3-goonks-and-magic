/** Preserve the existing native157 identity; replace its explicit VCMI adaptation. */
export const ORIGINAL_RETALIATION_SHIELD='wake-of-gods.artifacts:crimsonShieldOfRetribution';
export function validateOriginalRetaliationShield(root){if(!root||Object.keys(root).sort().join(',')!=='artifact,schemaVersion'||root.schemaVersion!==1||root.artifact!==ORIGINAL_RETALIATION_SHIELD)throw Error('Invalid original157 shield binding');return structuredClone(root);}
export function originalRetaliationDefinition(definitions){
 const next=structuredClone(definitions),definition=next.crimsonShieldOfRetribution;
 if(Object.keys(next).join(',')!=='crimsonShieldOfRetribution'||definition?.bonuses?.defence?.type!=='PRIMARY_SKILL'||definition.bonuses.defence.val!==2)throw Error('Changed native157 identity/Defense');
 const legacy=definition.bonuses.reduceDamage;
 if(!legacy||legacy.type!=='CREATURE_DAMAGE'||legacy.val!==-50||legacy.valueType!=='PERCENT_TO_BASE'||legacy.propagator!=='BATTLE_WIDE')throw Error('Changed original VCMI157 adaptation needs review');
 delete definition.bonuses.reduceDamage;
 definition.text.description="{Crimson Shield of Retribution}\n\nIncreases Defense by +2. Your army can retaliate against creatures that normally prevent retaliation. Other retaliation limits and disabling effects still apply.";
 return next;
}
