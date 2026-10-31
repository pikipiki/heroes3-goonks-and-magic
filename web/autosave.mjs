export function createAutosave({request,onStatus=()=>{},clock=()=>Date.now()}){
 let state={},pending=null,next=0,lastSaved=null,afterBattle=false;
 const status=(phase,error)=>onStatus({phase,lastSaved,error,pending:!!pending,interval:10000,deferred:state.mode==='battle'});
 const api={
  update(value){const previous=state.mode;state=value;if(value.mode==='battle'){afterBattle=true;pending=null;status('waiting');}if(value.autosaveAllowed&&((!lastSaved&&previous!==value.mode)||(value.mode==='map'&&previous==='lobby')||afterBattle)){afterBattle=false;queueMicrotask(()=>api.tick());}},
  tick(){if(pending&&clock()-pending.at>60000){pending=null;status('error','La sauvegarde précédente ne s’est pas terminée.');}if(pending)return;if(!state.autosaveAllowed){status('waiting');return;}pending={id:++next,at:clock()};status('saving');request(pending.id);},
  accepted({id,accepted}){if(pending?.id!==id)return;if(!accepted){pending=null;status('waiting');}},
  persisted({path,ok,error}){if(!pending||!String(path).toLowerCase().endsWith('/goonk-auto.vsgm1'))return;pending=null;if(ok){lastSaved=clock();status('saved');}else status('error',error||'Sauvegarde locale impossible.');}
 };return api;
}
export function installAutosave(){
 const controller=createAutosave({request:id=>window.Module?._vcmiMobileCommand?.(34,id,0,0,0,0),onStatus:value=>{window.goonkAutosaveStatus=value;window.dispatchEvent(new CustomEvent('goonk-autosave-status',{detail:value}));}});
 window.addEventListener('goonk-state',e=>controller.update(e.detail));window.addEventListener('goonk-autosave-accepted',e=>controller.accepted(e.detail));window.addEventListener('goonk-save-persisted',e=>controller.persisted(e.detail));
 setInterval(()=>{if(!document.hidden)controller.tick();},10000);return controller;
}
