import {formatBytes} from './loading.mjs';
// Fallback scale when no startup download plan is known. The bar never
// reports 100 % before the native menu is actually shown.
export const TEMPORARY_STARTUP_BYTES=405*1024*1024;
export const temporaryProgress=(bytes,expected=TEMPORARY_STARTUP_BYTES)=>Math.min(99,Math.floor(bytes/expected*100));
export function createTemporaryBoot(status){
 status.setAttribute('data-temporary-boot','');
 const readyStatus=document.createElement('div');
 readyStatus.className='temporary-boot-ready';
 readyStatus.setAttribute('role','status');
 document.body.append(readyStatus);
 let failed=false,finished=false,bar=null,detail=null,loaded=0,expected=TEMPORARY_STARTUP_BYTES;
 let stageOne=true;
 const monitor=setInterval(()=>{if(finished||failed){clearInterval(monitor);return;}if(stageOne&&detail){const download=globalThis.goonkEngineProgress;detail.textContent=download?formatBytes(download.loaded)+' / '+formatBytes(download.total)+' · Engine data':'Downloading and compiling the engine…';}},500);
 const watchdog=setTimeout(()=>{if(stageOne&&!finished&&!failed)api.fail(Error('Engine initialization timed out.'));},180000);
 const loading=(step,label,determinate=false)=>{
  if(failed)return;
  const progress=document.createElement('progress');
  progress.setAttribute('aria-label',label);
  if(determinate){progress.max=100;progress.value=0;}
  const stage=document.createElement('small');
  stage.className='temporary-boot-step';
  stage.textContent='Étape '+step+' sur 2';
  const title=document.createElement('p');
  title.textContent=label;
  const info=document.createElement('p');
  info.className='temporary-boot-detail';
  info.setAttribute('aria-live','polite');
  const note=document.createElement('small');
  note.textContent='Ce premier chargement peut prendre un moment.';
  status.replaceChildren(stage,title,progress,info,note);
  bar=determinate?progress:null;detail=info;
 };
 const render=()=>{
  if(!bar)return;
  const percent=temporaryProgress(loaded,expected);
  bar.value=percent;
  detail.textContent=percent+' % · '+formatBytes(loaded)+' téléchargés';
 };
 loading(1,'Chargement du moteur en mode temporaire…');
 const api={
  start(){
   stageOne=false;clearTimeout(watchdog);
   loading(2,'Chargement des données du jeu en mode temporaire…',true);
   render();
   return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  },
  plan(bytes){
   if(bytes>0)expected=bytes;
   render();
  },
  launching(){
   if(!bar)return Promise.resolve();
   status.querySelector('p').textContent='Démarrage du jeu…';
   render();
   return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  },
  progress(bytes){
   if(finished)return;
   loaded+=bytes;
   render();
  },
  ready(){
   finished=true;clearInterval(monitor);clearTimeout(watchdog);
   if(bar){bar.value=100;detail.textContent='100 % · '+formatBytes(loaded)+' téléchargés';}
   readyStatus.textContent='✓ Jeu chargé — prêt à jouer';
   // Startup feedback must not cover the controls once play has begun.
   const dismiss=()=>{clearTimeout(timer);globalThis.removeEventListener?.('goonk-state',playing);readyStatus.remove();};
   const playing=event=>{if(event.detail?.mode&&!['menu','lobby'].includes(event.detail.mode))dismiss();};
   const timer=setTimeout(dismiss,6000);
   globalThis.addEventListener?.('goonk-state',playing);
  },
  fail(error){
   if(failed||!document.body.hasAttribute('data-goonk-boot'))return;
   failed=true;clearInterval(monitor);clearTimeout(watchdog);
   console.error('Temporary game startup failed',error);
   const message=document.createElement('p');
   message.textContent='The engine could not finish loading. Check your connection, then retry.';
   const retry=document.createElement('button');
   retry.type='button';
   retry.textContent='Réessayer';
   retry.addEventListener('click',()=>location.reload());
   status.replaceChildren(message,retry);
  },
 };
 if(globalThis.goonkEngineStartupError)queueMicrotask(()=>api.fail(globalThis.goonkEngineStartupError));
 return api;
}

// Native initialization is not presentation: reveal only after a valid native
// window and two browser frames, so the mobile renderer can finish its handoff.
export function createBootHandoff({finish,schedule=callback=>requestAnimationFrame(callback)}){let queued=false,done=false;return{
 receive(state){if(queued||done||!state?.mode||!(state.rect?.w>0&&state.rect?.h>0))return;queued=true;schedule(()=>schedule(()=>{if(done)return;done=true;finish();}));},
 get done(){return done;}
};}
if(typeof window!=='undefined'&&document.body?.hasAttribute('data-goonk-boot')){
 const handoff=createBootHandoff({finish:()=>{
  document.body.removeAttribute('data-goonk-boot');
  const spinner=document.querySelector('#spinner');
  if(spinner)spinner.style.display='none';
  window.removeEventListener('goonk-state',receive);
  window.goonkTemporaryBoot?.ready();
 }});
 const receive=event=>handoff.receive(event.detail);window.addEventListener('goonk-state',receive);
}
