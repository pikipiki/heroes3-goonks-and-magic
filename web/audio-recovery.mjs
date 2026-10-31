// Resume the existing SDL context. Never create a second audio graph or change
// the player's mute preference merely because the browser paused its output.
// iOS Web Audio otherwise follows the phone's silent/ringer mode, even when running.
export function configurePlaybackSession(nav){
 try{if(!nav?.audioSession)return false;if(nav.audioSession.type!=='playback')nav.audioSession.type='playback';return true;}catch{return false;}
}
// Repair SDL's destination connection; explicit recovery also replaces a stalled
// ScriptProcessor while retaining its mixer callback and the same AudioContext.
export function repairSDLAudio(module,{rebuild=false}={}){
 const sdl=module?.SDL2,ctx=sdl?.audioContext,audio=sdl?.audio,node=audio?.scriptProcessorNode;
 if(!node||!ctx||ctx.state==='closed')return false;
 try{
  if(rebuild&&typeof node.onaudioprocess==='function'&&ctx.createScriptProcessor){
   const replacement=ctx.createScriptProcessor(node.bufferSize,0,audio.currentOutputBuffer?.numberOfChannels||node.channelCount||2);
   replacement.onaudioprocess=node.onaudioprocess;
   try{replacement.connect(ctx.destination);}catch(error){replacement.onaudioprocess=null;replacement.disconnect();throw error;}
   try{node.disconnect();}catch{}node.onaudioprocess=null;audio.scriptProcessorNode=replacement;
  }else node.connect(ctx.destination); // Connecting the same endpoints again is idempotent.
  return true;
 }catch{return false;}
}
export function createAudioRecovery({getContext,isMuted,onChange=()=>{},prepareOutput=()=>{}}){
 let watched=null,attempt=0,last='';
 const report=(phase,error='')=>{const key=phase+error;if(key!==last){last=key;onChange({phase,error});}};
 const observe=()=>{
  const ctx=getContext();if(ctx!==watched){watched?.removeEventListener?.('statechange',observe);watched=ctx;ctx?.addEventListener?.('statechange',observe);}
  const phase=isMuted()?'muted':!ctx?'loading':ctx.state==='running'?'running':ctx.state==='closed'?'closed':'paused';report(phase);return phase;
 };
 return{observe,async resume({repair=false}={}){
  const ctx=getContext();if(isMuted()){observe();return false;}try{prepareOutput({repair});}catch{}if(!ctx||ctx.state==='closed'){observe();return false;}if(ctx.state==='running'){observe();return true;}
  const token=++attempt;
  try{
   // Call resume synchronously in the gesture handler, before the first await.
   // Retry on later gestures even if an earlier browser-blocked promise hangs.
   await ctx.resume();if(token!==attempt)return ctx.state==='running'&&!isMuted();observe();return ctx.state==='running'&&!isMuted();
  }catch(error){if(token===attempt)report('paused',String(error?.message||error));return false;}
 }};
}
export function installAudioRecovery({getModule=()=>window.Module,isMuted,onChange,doc=document,win=window}){
 const audio=createAudioRecovery({getContext:()=>getModule()?.SDL2?.audioContext,isMuted,onChange,prepareOutput:({repair})=>{configurePlaybackSession(win.navigator);repairSDLAudio(getModule(),{rebuild:repair});}});
 const gesture=()=>{void audio.resume();},visible=()=>{if(doc.visibilityState!=='hidden')gesture();};
 for(const event of ['pointerdown','pointerup','touchend','click','keydown'])doc.addEventListener(event,gesture,{capture:true,passive:true});
 doc.addEventListener('visibilitychange',visible);win.addEventListener('pageshow',visible);win.addEventListener('focus',visible);
 return audio;
}
