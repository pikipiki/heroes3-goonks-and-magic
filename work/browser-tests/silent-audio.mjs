// End-to-end tests are inaudible by default without changing the user's settings
// or disabling the engine's audio graph. Opt in only for an audible audio test.
const prepared=new WeakSet();
export async function silenceTestAudio(page){
 if(prepared.has(page)||process.env.GOONK_TEST_AUDIO==='1')return;
 prepared.add(page);
 await page.addInitScript(()=>{
  const outputs=new WeakMap(),connect=globalThis.AudioNode?.prototype.connect;
  if(connect)globalThis.AudioNode.prototype.connect=function(destination,...args){
   if(destination===this.context.destination){let silent=outputs.get(this.context);if(!silent){silent=this.context.createGain();silent.gain.value=0;connect.call(silent,destination);outputs.set(this.context,silent);}return connect.call(this,silent,...args);}
   return connect.call(this,destination,...args);
  };
  const play=globalThis.HTMLMediaElement?.prototype.play;
  if(play)globalThis.HTMLMediaElement.prototype.play=function(...args){this.muted=true;return play.apply(this,args);};
 });
}
