import{chromium}from'playwright-core';import assert from'node:assert/strict';import fs from'node:fs';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9224'),out=n=>new URL('../../outputs/'+n,import.meta.url).pathname,report={errors:[],cases:[]};
for(const zero of [false,true]){
 const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage(),r={zeroPreferences:zero};p.on('pageerror',e=>report.errors.push(e.message));
 if(zero)await p.route('**/web/battle-scene.mjs',async route=>{const response=await route.fetch(),source=await response.text();await route.fulfill({response,body:source.replace('export function configureMobileBattle(FS,enabled){',`export function configureMobileBattle(FS,enabled){const file='/home/web_user/.config/vcmi/settings.json';let v={};try{v=JSON.parse(FS.readFile(file,{encoding:'utf8'}));}catch{}v.general={...v.general,sound:0,music:0};FS.writeFile(file,JSON.stringify(v));`)});});
 const wait=f=>p.waitForFunction(f,null,{timeout:120000}),click=n=>p.getByRole('button',{name:n,exact:true}).click();
 try{
  await (await import('./silent-audio.mjs')).silenceTestAudio(p);await p.goto('http://127.0.0.1:8767/game.html?mobile=1');await wait(()=>window.goonkGameMenuState?.ready&&window.Module?.SDL2?.audioContext&&window.goonkMobileState?.mode==='menu');
  if(!zero){await click('Nouvelle aventure');await wait(()=>goonkMobileState.selectedMap==='Goonks');await click('Commencer');await wait(()=>goonkMobileState.mode==='map');}
  r.initial=await p.evaluate(()=>({state:Module.SDL2.audioContext.state,sound:goonkGameMenuState.native.soundVolume,music:goonkGameMenuState.native.musicVolume}));if(zero)assert.equal(r.initial.sound+r.initial.music,0);
  await p.evaluate(()=>{const ctx=Module.SDL2.audioContext,node=Module.SDL2.audio.scriptProcessorNode;window.originalAudioContext=ctx;window.audioMeter=ctx.createAnalyser();audioMeter.fftSize=2048;const gain=ctx.createGain();gain.gain.value=0;node.connect(audioMeter);audioMeter.connect(gain);gain.connect(ctx.destination);});
  if(!zero){
   await p.evaluate(()=>Module.SDL2.audioContext.suspend());await p.setViewportSize({width:844,height:390});await p.waitForTimeout(100);await p.setViewportSize({width:390,height:844});await click('Recentrer sur le héros');await p.waitForFunction(()=>Module.SDL2.audioContext.state==='running',null,{timeout:5000});r.resumedAfterRotation=true;
  }
  await click('Menu du jeu');await click('Son');
  const energy=p.evaluate(async()=>{let peak=0;const samples=new Float32Array(audioMeter.fftSize);for(let n=0;n<60;n++){audioMeter.getFloatTimeDomainData(samples);for(const v of samples)peak=Math.max(peak,Math.abs(v));await new Promise(r=>setTimeout(r,10));}return peak;});
  await click('Rétablir le son');r.signalPeak=await energy;assert(r.signalPeak>0.0001,'Native audio must produce a real signal');await p.waitForFunction(()=>!goonkGameMenuState.native.audioMuted&&(goonkGameMenuState.native.soundVolume>0||goonkGameMenuState.native.musicVolume>0));r.restored=await p.evaluate(()=>({sound:goonkGameMenuState.native.soundVolume,music:goonkGameMenuState.native.musicVolume,sameContext:originalAudioContext===Module.SDL2.audioContext}));assert(r.restored.sameContext);
  await click('🔇 Couper le son');await wait(()=>goonkGameMenuState.native.audioMuted&&goonkGameMenuState.native.soundVolume===0&&goonkGameMenuState.native.musicVolume===0);await p.evaluate(()=>Module.SDL2.audioContext.suspend());await click('Fermer le menu');await p.locator('#mobile-app .mobile-title').click();await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>Module.SDL2.audioContext.state),'suspended');r.muteRespected=true;
  await click('Menu du jeu');await click('🔊 Réactiver le son');await p.waitForFunction(()=>!goonkGameMenuState.native.audioMuted&&Module.SDL2.audioContext.state==='running',null,{timeout:5000});r.unmuteResumed=true;
  await p.screenshot({path:out(zero?'audio-zero-volume-recovered.png':'audio-resumed-mobile.png')});report.cases.push(r);
 }catch(e){r.failure=e.stack;report.cases.push(r);await p.screenshot({path:out('audio-native-failure.png')});throw e;}
 finally{await c.close();}
}
assert.deepEqual(report.errors,[]);fs.writeFileSync(out('audio-native-e2e.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
