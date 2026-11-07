export function createTemporaryBoot(status){
 status.setAttribute('data-temporary-boot','');
 let failed=false;
 const loading=label=>{
  if(failed)return;
  const progress=document.createElement('progress');
  progress.setAttribute('aria-label',label);
  const title=document.createElement('p');
  title.textContent=label;
  const note=document.createElement('small');
  note.textContent='Ce premier chargement peut prendre un moment.';
  status.replaceChildren(title,progress,note);
 };
 loading('Chargement du moteur en mode temporaire…');
 return {
  start(){
   loading('Chargement des données du jeu en mode temporaire…');
   return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
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
 const handoff=createBootHandoff({finish:()=>{document.body.removeAttribute('data-goonk-boot');const spinner=document.querySelector('#spinner');if(spinner)spinner.style.display='none';window.removeEventListener('goonk-state',receive);}});
 const receive=event=>handoff.receive(event.detail);window.addEventListener('goonk-state',receive);
}
