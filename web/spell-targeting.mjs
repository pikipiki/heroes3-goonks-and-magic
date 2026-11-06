import{battleCapabilities}from'./battle-phase.mjs';
export const canCancelSpell=state=>state.mode==='battle'&&state.spellTargeting===true&&!state.autoCombat&&!state.tacticsMode&&(state.round??0)>0;
export function spellTargetCell(state,point){
 if(!point)return null;
 let nearest=null,distance=Infinity;
 for(const cell of state.battleCells||[]){
  const delta=(cell.x-point.x)**2+(cell.y-point.y)**2;
  if(delta<distance){nearest=cell;distance=delta;}
 }
 return nearest?.spellTarget===false?null:nearest;
}
// Cancel directly in the native battle, then wait for authoritative state.
// Never send a creature/team order while the engine is still targeting a spell.
export function createSpellTargetingRecovery({command,onChange=()=>{},onError=()=>{},clock=()=>Date.now()}){
 let pending=null;
 const clear=()=>{pending=null;onChange();};
 return{
  request(state,action=null,value=0){if(pending||!canCancelSpell(state))return false;pending={action,value,actor:state.activeStack,round:state.round,started:clock()};command(14,2);onChange();return true;},
  update(state){if(!pending)return;if(state.mode!=='battle'||state.tacticsMode||state.round!==pending.round){clear();return;}if(clock()-pending.started>5000){clear();onError('Spell cancellation was not confirmed. Try Cancel spell again.');return;}if(state.spellTargeting)return;
   if(pending.action===null){clear();return;}
   const ready=pending.action===44?state.canAutoCombat===true:pending.action===38?battleCapabilities(state).combatReady&&state.canRetreat===true:battleCapabilities(state).combatReady&&(pending.actor===undefined||state.activeStack===pending.actor);
   if(!ready)return;const {action,value}=pending;clear();command(action,value);
  },get pending(){return pending;}
 };
}
