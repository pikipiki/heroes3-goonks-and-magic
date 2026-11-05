// Command 44 sets an explicit state; repeating it cannot toggle the AI back off.
// Keep the user's intent across transient native unavailability and stale snapshots.
export function createBattleAutocombat({command,onChange=()=>{},onError=()=>{},clock=()=>Date.now(),retry=500,timeout=8000}){
 let pending=null;
 const clear=()=>{pending=null;onChange(null);};
 return{
  request(state,enabled){if(pending||state.mode!=='battle'||state.canAutoCombat!==true)return false;pending={enabled:!!enabled,started:clock(),sent:clock(),round:state.round??0};onChange(pending.enabled);command(44,pending.enabled?1:0);return true;},
  update(state){if(!pending)return;if(state.mode!=='battle'||(state.round??0)<pending.round){clear();return;}if(state.autoCombat===pending.enabled){clear();return;}const now=clock();if(now-pending.started>=timeout){clear();onError('Autocombat did not respond. Try again.');return;}if(state.canAutoCombat===true&&now-pending.sent>=retry){pending.sent=now;command(44,pending.enabled?1:0);}},
  get pending(){return pending;}
 };
}
