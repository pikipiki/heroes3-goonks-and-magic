import {formatBytes} from './loading.mjs';
// Fallback scale when no startup download plan is known. The bar never
// reports 100 % before the native menu is actually shown.
export const TEMPORARY_STARTUP_BYTES=80*1024*1024;
export const temporaryProgress=(bytes,expected=TEMPORARY_STARTUP_BYTES)=>Math.min(99,Math.floor(bytes/expected*100));
export function createTemporaryBoot(status){
 status.setAttribute('data-temporary-boot','');
 const readyStatus=document.createElement('div');
 readyStatus.className='temporary-boot-ready';
 readyStatus.setAttribute('role','status');
 document.body.append(readyStatus);
 let failed=false,bar=null,detail=null,loaded=0,expected=TEMPORARY_STARTUP_BYTES;
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
  bar=determinate?progress:null;detail=determinate?info:null;
 };
 const render=()=>{
  if(!bar)return;
  const percent=temporaryProgress(loaded,expected);
  bar.value=percent;
  detail.textContent=percent+' % · '+formatBytes(loaded)+' téléchargés';
 };
 loading(1,'Chargement du moteur en mode temporaire…');
 return {
  start(){
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
   loaded+=bytes;
   render();
  },
  ready(){
   if(bar){bar.value=100;detail.textContent='100 % · '+formatBytes(loaded)+' téléchargés';}
   readyStatus.textContent='✓ Jeu chargé — prêt à jouer';
   setTimeout(()=>readyStatus.remove(),6000);
  },
  fail(error){
   if(failed||!document.body.hasAttribute('data-goonk-boot'))return;
   failed=true;
   console.error('Temporary game startup failed',error);
   const message=document.createElement('p');
   message.textContent='Le chargement du jeu a échoué.';
   const retry=document.createElement('button');
   retry.type='button';
   retry.textContent='Réessayer';
   retry.addEventListener('click',()=>location.reload());
   status.replaceChildren(message,retry);
  },
 };
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
