import {chromium,webkit} from 'playwright-core';
import assert from 'node:assert/strict';import fs from 'node:fs';
const report={};
for(const kind of ['chromium','webkit']){
 const executable=kind==='webkit'?process.env.WEBKIT_PATH:process.env.CHROME_PATH;
 const browser=await(kind==='webkit'?webkit:chromium).launch({headless:true,...(executable?{executablePath:executable}:{}),...(kind==='chromium'?{args:['--no-sandbox']}: {})});
 const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),p=await c.newPage(),result={errors:[]};report[kind]=result;p.on('pageerror',e=>result.errors.push(e.message));
 try{
  await p.route('**/audio-repair-fixture',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html class="goonk-mobile"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web/game-menu.css"><link rel="stylesheet" href="/web/h3-theme.css"></head><body><div id="mobile-app"><span class="mobile-brand">GOONK</span></div><script>
  localStorage.setItem('heroes-goonk.audio-muted','true');window.goonkMobileActive=true;window.ctx=new(window.AudioContext||window.webkitAudioContext)();const node=ctx.createScriptProcessor(2048,0,2);let phase=0;window.frames=0;window.commands=[];
  window.snapshot={mode:'map',day:1,soundVolume:75,musicVolume:75,audioMuted:false};window.emit=s=>dispatchEvent(new CustomEvent('goonk-state',{detail:{...(s||snapshot)}}));
  window.Module={SDL2:{audioContext:ctx,audio:{scriptProcessorNode:node}},_vcmiMobileEnable(){},_vcmiMobileCommand(action,value,preview){commands.push([action,value,preview]);if(action===28){const old={...snapshot};setTimeout(()=>emit(old),20);setTimeout(()=>{snapshot.audioMuted=!!value;snapshot.soundVolume=snapshot.musicVolume=value?0:75;emit();},90);}}};
  node.onaudioprocess=e=>{frames++;Module.SDL2.audio.currentOutputBuffer=e.outputBuffer;for(let channel=0;channel<2;channel++){const out=e.outputBuffer.getChannelData(channel);for(let i=0;i<out.length;i++)out[i]=snapshot.audioMuted?0:Math.sin((phase+i)*.03)*.1;}phase+=2048;};node.connect(ctx.destination);setInterval(()=>emit(),150);
  </script><script type="module" src="/web/game-menu.mjs"></script></body></html>`}));
  await p.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8771')+'/audio-repair-fixture');await p.waitForFunction(()=>window.goonkGameMenuState?.ready&&goonkGameMenuState.native.audioMuted);
  await p.getByRole('button',{name:'Menu du jeu',exact:true}).tap();const sound=p.getByRole('switch',{name:'Son',exact:true});
  assert.equal(await sound.count(),1);assert.equal(await p.locator('[data-menu=recover-sound]').count(),0);assert.equal(await sound.getAttribute('aria-checked'),'false');assert.equal(await p.getByRole('button',{name:'Son',exact:true}).count(),0);result.singleSoundControl=true;
  await p.evaluate(()=>{window.old=Module.SDL2.audio.scriptProcessorNode;old.disconnect();});await sound.tap();assert.equal(await sound.getAttribute('aria-checked'),'true');await p.waitForFunction(()=>!goonkGameMenuState.native.audioMuted&&Module.SDL2.audio.scriptProcessorNode!==old&&ctx.state==='running'&&frames>4);
  result.repaired=await p.evaluate(()=>({sameContext:Module.SDL2.audioContext===ctx,callbacks:frames,sessionType:navigator.audioSession?.type,preference:localStorage.getItem('heroes-goonk.audio-muted')}));assert(result.repaired.sameContext);assert.equal(result.repaired.preference,'false');if(result.repaired.sessionType)assert.equal(result.repaired.sessionType,'playback');
  await p.getByRole('button',{name:'Codes de triche',exact:true}).tap();await p.getByRole('button',{name:'Réglages',exact:true}).tap();assert.equal(await sound.getAttribute('aria-checked'),'true');
  await p.setViewportSize({width:844,height:390});await p.setViewportSize({width:390,height:844});await sound.tap();await p.waitForFunction(()=>goonkGameMenuState.native.audioMuted);assert.equal(await sound.getAttribute('aria-checked'),'false');assert.equal(await p.evaluate(()=>localStorage.getItem('heroes-goonk.audio-muted')),'true');
  await p.evaluate(()=>ctx.suspend());await p.getByRole('button',{name:'Fermer le menu',exact:true}).tap();await p.evaluate(()=>dispatchEvent(new Event('focus')));assert.equal(await p.evaluate(()=>ctx.state),'suspended');result.mutePreserved=true;assert.deepEqual(result.errors,[]);console.log(kind,JSON.stringify(result));
 }catch(e){result.failure=e.stack;throw e;}finally{await browser.close();fs.writeFileSync('/private/tmp/goonk-single-sound-report.json',JSON.stringify(report,null,2));}
}
