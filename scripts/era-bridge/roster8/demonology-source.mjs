import{DEMONOLOGY_UI_GRAPHICS}from'./demonology-ui-assets.mjs';
/** Source mode2 Demonology building blocks. These do not declare whole actors
 * complete: Pit Master217 still requires the distinct XPu#48 round2 contract. */
export const SOURCE_DEMONOLOGY_CONTRACT='source-demonology-mode2-v1';
export function sourceDemonologyCaster(text,{sourceId,contract}={}){
 if(contract!==SOURCE_DEMONOLOGY_CONTRACT||![217,338].includes(sourceId))throw Error('Explicit reviewed Demonology actor required');
 const expected=sourceId===217?{Flags:65552,Level:4,Town:3,'Spell 1':2,'Spell 2':0,'Spell 3':0,Demonology:49,isCerberus:1}:{ShootingResistance:0.3,Flags:273,Level:6,Town:3,'Spell 1':2,'Spell 2':0,'Spell 3':0,Demonology:217};
 const fields=new Map();for(const line of text.split(/\r?\n/)){const m=/^([^=]+)=(.*)$/.exec(line.trim());if(!m)continue;if(fields.has(m[1]))throw Error('Duplicate Demonology source property');fields.set(m[1],Number(m[2]));}
 if(fields.size!==Object.keys(expected).length||Object.entries(expected).some(([k,v])=>fields.get(k)!==v))throw Error('Unreviewed Demonology source fields');
 const target=sourceId===217?'core:hornedDemon':'third-upgrades:tumPitMaster',spell='tum-era:sourceDemonology'+expected.Demonology;
 return {complete:false,sourceId,target,spell,sourceCasts:1,abilities:{sourceDemonCaster:{type:'SPELLCASTER',subtype:spell,val:0},sourceDemonPower:{type:'SPECIFIC_SPELL_POWER',subtype:spell,val:50}},evidence:['tables.cpp10898..10905 count*50; default multiplier/divider1/add0','h3era447098..4470E9 and4471D2..44722C: min(casterCount*50,corpseInitialCount*corpseCurrentMaxHP)/targetBaseHP then min(corpseCount)','h3era5A41DC..E8 ALIVE corpse gate','Native CUnitState.getEffectValue=currentCount*SPECIFIC_SPELL_POWER;getSpellBonus returnsbase unchanged']};
}
export function sourceDemonologySpell(nativeSummonDemons,caster){
 if(![217,338].includes(caster?.sourceId)||caster.spell!=='tum-era:sourceDemonology'+(caster.sourceId===217?49:217)||caster.target!==(caster.sourceId===217?'core:hornedDemon':'third-upgrades:tumPitMaster'))throw Error('Reviewed caster required');
 const spell=structuredClone(nativeSummonDemons);delete spell.index;
 spell.name='Demonology';spell.targetCondition={};spell.graphics={...DEMONOLOGY_UI_GRAPHICS};
 spell.levels.base.description='Converts a fallen living allied troop into '+(caster.sourceId===217?'Horned Demons':'Pit Masters')+'. Each surviving caster supplies 50 hit points, capped by the original corpse hit points and creature count. The converted troop keeps its original army slot.';
 const effect=spell.levels?.base?.battleEffects?.demonSummon;
 if(effect?.type!=='core:demonSummon'||effect.id!=='demon')throw Error('Unreviewed native DemonSummon effect');
 effect.id=caster.target;effect.eraDemonology=true;
 return spell;
}
