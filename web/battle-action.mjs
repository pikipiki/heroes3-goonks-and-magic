// Native labels and legality include creature spells, healing, wide stacks and corpses.
// Do not infer abilities from creature names or consume RNG to preview genie spells.
export function contextualBattleAction(state,point){
 const cell=point&&(state.battleCells||[]).find(c=>Math.hypot(c.x-point.x,c.y-point.y)<16);
 if(state.spellTargeting)return {label:state.selectedSpell?'Cast '+state.selectedSpell:'Cast spell',enabled:cell?.spellTarget===true,hex:cell?.hex};
 const ally=point&&(state.battleUnits||[]).find(u=>!u.enemy&&Math.hypot(u.x-point.x,u.y-point.y)<16);
 const fallback=ally&&state.creatureCanCast&&state.creatureSpellName?'Cast '+state.creatureSpellName:'Move';
 return {label:cell?.actionLabel||fallback,enabled:!!cell?.actionLabel,hex:cell?.hex};
}
