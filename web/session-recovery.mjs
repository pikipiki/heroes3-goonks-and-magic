const SAVE_ROOT='/home/web_user/.local/share/vcmi/Saves';
const saveName=value=>String(value||'').replace(/\\/g,'/').split('/').at(-1).replace(/\.vsgm1$/i,'').toLowerCase();
export function listLocalSaves(FS){
 try{return FS.readdir(SAVE_ROOT).filter(name=>/\.vsgm1$/i.test(name)).flatMap(name=>{
  try{const stat=FS.stat(SAVE_ROOT+'/'+name);return stat.size>0?[{name:saveName(name),modified:Number(stat.mtime)||0}]:[];}catch{return[];}
 }).sort((a,b)=>b.modified-a.modified||a.name.localeCompare(b.name));}catch{return[];}
}
// Boot-only recovery. Foregrounding a live engine never sends a load command.
export function createSessionRecovery({listSaves,command,onStatus=()=>{},clock=()=>Date.now()}){
 let phase='idle',checked=false,candidates=[],chosen=null,lastProgress=clock();
 const status=(value,error)=>{phase=value;lastProgress=clock();onStatus({phase,error,save:chosen?.name,busy:['opening','selecting','starting'].includes(phase),canDismiss:phase!=='starting'});};
 const fail=error=>status('failed',error);
 const api={
  get phase(){return phase;},
  update(state){
   if(['map','town','battle','dialog','recruit','fort','creature'].includes(state.mode)){
    // A loading error can be a native modal; only a real game snapshot completes recovery.
    if(state.day!==undefined||state.heroId!==undefined||state.townId!==undefined){checked=true;if(phase!=='done')status('done');return;}
   }
   if(!checked){
    checked=true;
    if(state.mode!=='menu'){status('done');return;}
    try{candidates=listSaves();if(!candidates.length){status('done');return;}status('opening');command(23);}catch(error){fail(String(error));}
    return;
   }
   if(!['opening','selecting','starting'].includes(phase))return;
   try{
    if(phase==='opening'&&state.mode==='load'&&state.lobbyReady){
     // The native list has already parsed save headers; ignore corrupt/incompatible files.
     for(const candidate of candidates){chosen=(state.maps||[]).find(entry=>saveName(entry.file||entry.name)===candidate.name);if(chosen)break;}
     if(!chosen){fail('Aucune sauvegarde locale compatible. Choisis une partie manuellement.');return;}
     status('selecting');command(27,chosen.index);return;
    }
    if(phase==='selecting'&&state.mode==='load'&&state.lobbyReady&&state.selectedIndex===chosen.index){status('starting');command(22);}
   }catch(error){fail(String(error));}
  },
  tick(){if(['opening','selecting','starting'].includes(phase)&&clock()-lastProgress>60000)fail('La reprise prend trop de temps. Tu peux choisir une sauvegarde manuellement.');},
  wake(){lastProgress=clock();},
  dismiss(){if(phase==='starting')return false;checked=true;status('dismissed');return true;},
  get intercept(){return ['opening','selecting','starting'].includes(phase);}
 };
 return api;
}
export function installSessionRecovery({win=window,doc=document}={}){
 const dialog=doc.createElement('dialog');dialog.className='session-recovery';dialog.setAttribute('aria-labelledby','session-recovery-title');
 dialog.innerHTML='<h2 id="session-recovery-title">Reprise de ta partie</h2><p class="session-recovery-message" role="status" aria-live="polite"></p><button type="button">Choisir une autre partie</button>';
 doc.body.append(dialog);const message=dialog.querySelector('p'),button=dialog.querySelector('button');
 const recovery=createSessionRecovery({listSaves:()=>listLocalSaves(win.Module?.FS),command:(a,b=0)=>win.Module?._vcmiMobileCommand?.(a,b,0,0,0,0),onStatus:info=>{
  win.goonkSessionRecovery=info;
  const show=info.busy||info.phase==='failed';dialog.dataset.busy=String(info.busy);button.disabled=!info.canDismiss;
  message.textContent=info.error||(info.phase==='starting'?'Chargement de la dernière sauvegarde…':'Recherche de la dernière sauvegarde enregistrée sur cet appareil…');
  if(show&&!dialog.open)dialog.showModal();else if(!show&&dialog.open)dialog.close();
 }});
 button.onclick=()=>recovery.dismiss();dialog.addEventListener('cancel',event=>{event.preventDefault();recovery.dismiss();});dialog.addEventListener('keydown',event=>event.stopPropagation());
 // Run before the mobile lobby's default selection; it must not race the resume choice.
 win.addEventListener('goonk-state',event=>{recovery.update(event.detail);if(recovery.intercept)event.stopImmediatePropagation();},true);
 const timer=win.setInterval(()=>{if(!doc.hidden)recovery.tick();},1000);
 doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)recovery.wake();});win.addEventListener('pageshow',()=>recovery.wake());
 return{recovery,dispose:()=>win.clearInterval(timer)};
}
if(typeof window!=='undefined'&&typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>installSessionRecovery());else installSessionRecovery();
}
