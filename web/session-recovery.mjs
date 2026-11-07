import {requestedHostedMatch} from './hosted-turn-notifications.mjs';
import {scenarioTitle} from './scenario-title.mjs';
const RECOVERY_CHOICE_MS=1800;
const SAVE_ROOT='/home/web_user/.local/share/vcmi/Saves';
const saveName=value=>String(value||'').replace(/\\/g,'/').split('/').at(-1).replace(/\.vsgm1$/i,'').toLowerCase();
export function listLocalSaves(FS){
 try{return FS.readdir(SAVE_ROOT).filter(name=>/\.vsgm1$/i.test(name)).flatMap(name=>{
  try{const stat=FS.stat(SAVE_ROOT+'/'+name);return stat.size>0?[{name:saveName(name),modified:Number(stat.mtime)||0}]:[];}catch{return[];}
 }).sort((a,b)=>b.modified-a.modified||a.name.localeCompare(b.name));}catch{return[];}
}
// Boot-only recovery. Foregrounding a live engine never sends a load command.
export function createSessionRecovery({listSaves,command,onStatus=()=>{},manual=false,newGame=false,campaign=false,hosted=false,custom=null,skipResume=false,onRestart=()=>{},onMenu=()=>{},clock=()=>Date.now()}){
 const activePhases=['opening','selecting','ready','starting','custom-opening','custom-configuring','returning'];
 let phase='idle',checked=false,candidates=[],chosen=null,lastProgress=clock(),startSent=false;
 let lastState,closingScreen,returnFailed=false;
 const status=(value,error)=>{phase=value;lastProgress=clock();onStatus({phase,error,save:chosen?.name,scenario:chosen?.scenario,busy:activePhases.includes(phase),canDismiss:phase!=='starting'&&phase!=='returning',requiresReload:phase==='failed'&&(startSent||returnFailed)});};
 function returnToMenu(mode){
  if(mode==='menu'&&closingScreen){status('dismissed');return;}
  if(['connecting','load','lobby','dialog'].includes(mode)&&closingScreen!==mode){
   closingScreen=mode;
   command(0);
  }
 }
 const fail=error=>status('failed',error);
 const api={
  get phase(){return phase;},
  update(state){
   lastState=state;
   if(phase==='returning'){returnToMenu(state.mode);return;}
   if(['map','town','battle','dialog','recruit','fort','creature'].includes(state.mode)){
    // A loading error can be a native modal; only a real game snapshot completes recovery.
    if(state.day!==undefined||state.heroId!==undefined||state.townId!==undefined){checked=true;if(phase!=='done')status('done');return;}
   }
   if(!checked){
    checked=true;
    if(custom&&state.mode==='menu'){status('custom-opening');command(20,custom[1]);return;}
    if(campaign&&state.mode==='menu'){status('dismissed');command(47);return;}
    if(newGame&&state.mode==='menu'){status('dismissed');command(20);return;}
    if(manual&&state.mode==='menu'){status('dismissed');command(23);return;}
    if(skipResume||hosted||state.mode!=='menu'){status('done');return;}
    try{candidates=listSaves().filter(save=>save.name!=='goonk-online-auto');if(!candidates.length){status('done');return;}status('opening');command(23);}catch(error){fail(String(error));}
    return;
   }
   if(phase==='custom-opening'){if(state.mode==='lobby'&&state.lobbyReady){status('custom-configuring');command(48,...custom);}return;}
   if(phase==='custom-configuring'){if(state.mode==='lobby'&&state.lobbyReady&&state.customMap)status('dismissed');return;}
   if(!['opening','selecting','ready','starting'].includes(phase))return;
   try{
    if(phase==='opening'&&state.mode==='load'&&state.lobbyReady){
     // The native list has already parsed save headers; ignore corrupt/incompatible files.
     for(const candidate of candidates){chosen=(state.maps||[]).find(entry=>saveName(entry.file||entry.name)===candidate.name);if(chosen)break;}
     if(!chosen){fail('Aucune sauvegarde locale compatible. Choisis une partie manuellement.');return;}
     status('selecting');command(27,chosen.index);return;
    }
    if(state.mode==='load'&&state.lobbyReady&&state.selectedIndex===chosen?.index){
     if(phase==='selecting')status('ready');
     if(phase==='ready'&&clock()-lastProgress>=RECOVERY_CHOICE_MS){startSent=true;status('starting');command(22);}
    }
   }catch(error){fail(String(error));}
  },
  tick(){
   if(clock()-lastProgress<=60000)return;
   if(phase==='returning'&&lastState?.mode==='menu'){status('dismissed');onMenu(lastState);}
   else if(phase==='returning'){returnFailed=true;fail('Le retour au menu prend trop de temps.');}
   else if(['opening','selecting','ready','starting'].includes(phase))fail('La reprise prend trop de temps.');
  },
  wake(){lastProgress=clock();},
  dismiss(){
   if(phase==='starting'||phase==='returning')return false;
   checked=true;
   if(startSent||returnFailed){onRestart();return true;}
   if(phase==='failed'&&lastState?.mode==='menu'){status('dismissed');onMenu(lastState);return true;}
   status('returning');
   returnToMenu(lastState?.mode);
   return true;
  },
  get intercept(){return activePhases.includes(phase);}
 };
 return api;
}
export function installSessionRecovery({win=window,doc=document}={}){
 const dialog=doc.createElement('dialog');dialog.className='session-recovery';dialog.setAttribute('aria-labelledby','session-recovery-title');
 dialog.innerHTML='<h2 id="session-recovery-title">Reprise de ta partie</h2><p class="session-recovery-message" role="status" aria-live="polite"></p><button type="button">Choisir une autre partie</button>';
 doc.body.append(dialog);const message=dialog.querySelector('p'),button=dialog.querySelector('button');
 const url=new URL(win.location.href),manual=url.searchParams.get('choose-save')==='1',newGame=url.searchParams.get('new-game')==='1',campaign=url.searchParams.get('new-campaign')==='1';if(campaign){url.searchParams.delete('new-campaign');win.history.replaceState(null,'',url.href);}if(newGame){url.searchParams.delete('new-game');win.history.replaceState(null,'',url.href);}if(manual){url.searchParams.delete('choose-save');win.history.replaceState(null,'',url.href);}
 let custom=null;try{const value=JSON.parse(url.searchParams.get('custom-game'));if(Array.isArray(value)&&value.length===5&&value.every(Number.isInteger)&&value[0]>=2&&value[0]<=8&&value[1]>=1&&value[1]<=value[0]&&[36,72,108,144].includes(value[2]))custom=value;}catch{}if(custom){url.searchParams.delete('custom-game');win.history.replaceState(null,'',url.href);}
 const skipResume=url.searchParams.has('skip-autoresume');
 if(skipResume){url.searchParams.delete('skip-autoresume');win.history.replaceState(null,'',url.href);}
 const recovery=createSessionRecovery({manual,newGame,campaign,skipResume,hosted:Boolean(win.goonkHostedAlerts&&requestedHostedMatch(url.search)),custom,onRestart:()=>{
  const next=new URL(win.location.href);
  next.searchParams.set('skip-autoresume','1');
  win.location.replace(next.href);
 },onMenu:state=>win.dispatchEvent(new CustomEvent('goonk-state',{detail:state})),listSaves:()=>listLocalSaves(win.Module?.FS),command:(a,b=0,c=0,d=0,e=0,f=0)=>win.Module?._vcmiMobileCommand?.(a,b,c,d,e,f),onStatus:info=>{
  win.goonkSessionRecovery=info;
  const show=info.busy||info.phase==='failed';dialog.dataset.busy=String(info.busy);button.hidden=!info.canDismiss;
  button.textContent=info.requiresReload?'Recharger le jeu et revenir au menu':'Choisir une autre partie';
  message.textContent=info.error||(info.phase==='returning'?'Retour au menu principal…':null)||(['custom-opening','custom-configuring'].includes(info.phase)?'Preparing game options…':null)||(info.phase==='starting'?'Chargement de la dernière sauvegarde…':info.phase==='ready'?(info.scenario?scenarioTitle(info.scenario):'Reprise de la dernière sauvegarde…'):'Recherche de la dernière sauvegarde enregistrée sur cet appareil…');
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
