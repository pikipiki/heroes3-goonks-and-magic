import{test}from'node:test';import assert from'node:assert/strict';import{createAudioRecovery}from'../web/audio-recovery.mjs';
for(const state of ['suspended','interrupted'])test('Resume SDL context after '+state,async()=>{
 let calls=0;const context={state,resume(){calls++;this.state='running';return Promise.resolve();}},phases=[],audio=createAudioRecovery({getContext:()=>context,isMuted:()=>false,onChange:p=>phases.push(p.phase)});
 assert.equal(audio.observe(),'paused');assert(await audio.resume());assert.equal(calls,1);assert.equal(phases.at(-1),'running');
});
test('A pending autoplay promise does not prevent recovery on a new gesture',async()=>{
 let calls=0;const context={state:'suspended',resume(){if(++calls===1)return new Promise(()=>{});this.state='running';return Promise.resolve();}},audio=createAudioRecovery({getContext:()=>context,isMuted:()=>false});
 void audio.resume();assert(await audio.resume());assert.equal(calls,2);
});
test('Keep the mute choice during background recovery and an in-flight resume',async()=>{
 let muted=true,calls=0,finish;const context={state:'suspended',resume(){calls++;return new Promise(r=>finish=r);}},audio=createAudioRecovery({getContext:()=>context,isMuted:()=>muted});assert.equal(await audio.resume(),false);assert.equal(calls,0);
 muted=false;const pending=audio.resume();muted=true;context.state='running';finish();assert.equal(await pending,false);assert.equal(audio.observe(),'muted');
});
test('Handle unavailable, closed and rejected contexts without crashing the game',async()=>{
 for(const context of [null,{state:'closed'},{state:'suspended',resume(){return Promise.reject(Error('gesture required'));}}]){const audio=createAudioRecovery({getContext:()=>context,isMuted:()=>false});assert.equal(await audio.resume(),false);}
});
