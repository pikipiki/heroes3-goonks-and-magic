import{test}from'node:test';import assert from'node:assert/strict';import{createAudioRecovery,configurePlaybackSession,repairSDLAudio}from'../web/audio-recovery.mjs';
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
test('A running context still configures the physical output route before reporting ready',async()=>{
 const calls=[],context={state:'running',resume(){throw Error('Already running');}};
 const audio=createAudioRecovery({getContext:()=>context,isMuted:()=>false,prepareOutput:()=>calls.push('playback')});
 assert(await audio.resume());assert.deepEqual(calls,['playback']);
});
test('Mute never changes the output session; unavailable platform routing cannot block resume',async()=>{
 let calls=0;const context={state:'running'};assert(!await createAudioRecovery({getContext:()=>context,isMuted:()=>true,prepareOutput:()=>calls++}).resume());assert.equal(calls,0);
 assert(await createAudioRecovery({getContext:()=>context,isMuted:()=>false,prepareOutput:()=>{throw Error('Unsupported');}}).resume());
});

test('iOS playback routing is feature-detected and does not throw on unsupported platforms',()=>{
 const nav={audioSession:{type:'ambient'}};assert(configurePlaybackSession(nav));assert.equal(nav.audioSession.type,'playback');assert(!configurePlaybackSession({}));assert(!configurePlaybackSession());assert(!configurePlaybackSession({get audioSession(){throw Error('Unavailable');}}));
});

test('Explicit recovery replaces a stalled SDL processor but retains its mixer and context',()=>{
 let disconnected=0,connected=0;const callback=()=>42,destination={},replacement={connect:to=>{assert.equal(to,destination);connected++;},disconnect(){}};
 const node={bufferSize:2048,channelCount:2,onaudioprocess:callback,disconnect:()=>disconnected++,connect:()=>connected++};
 const ctx={state:'running',destination,createScriptProcessor:(size,input,channels)=>{assert.deepEqual([size,input,channels],[2048,0,2]);return replacement;}};
 const module={SDL2:{audioContext:ctx,audio:{scriptProcessorNode:node}}};
 assert(repairSDLAudio(module));assert.equal(module.SDL2.audio.scriptProcessorNode,node);
 assert(repairSDLAudio(module,{rebuild:true}));assert.equal(module.SDL2.audioContext,ctx);assert.equal(module.SDL2.audio.scriptProcessorNode,replacement);assert.equal(replacement.onaudioprocess,callback);assert.equal(node.onaudioprocess,null);assert.equal(disconnected,1);assert.equal(connected,2);
});
