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
