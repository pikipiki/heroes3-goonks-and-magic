import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import os from 'node:os';
const label=process.env.PROFILE_LABEL||'baseline',output=process.env.PROFILE_OUTPUT||'/tmp/private-freeze-'+label+'.json';
const kind=process.env.BROWSER||'chromium';
const report={label,browser:kind,cpuRate:Number(process.env.CPU_RATE||1),storage:'isolated private context with OPFS unavailable',phases:[],errors:[]};
const browser=await (kind==='webkit'?webkit:chromium).launch({headless:true,...(kind==='chromium'?{args:['--no-sandbox']}: {})});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('BROWSER',m.text().slice(0,250));});page.on('requestfailed',r=>console.log('REQUEST',r.url(),r.failure()?.errorText));
 if(process.env.CACHE_FIX_ONLY)await page.route('**/web/temporary-assets.mjs*',r=>r.fulfill({path:path.resolve('web/temporary-assets.mjs')}));
 await page.addInitScript(()=>{
  sessionStorage.setItem('heroes-goonk.storage-failed','true');
  const s=window.profile={tasks:[],frames:[],xhr:[],handlers:[],audio:[],glReads:[]};
  const drawImage=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(source,...a){if(source===document.getElementById('canvas'))s.glReads.push({at:performance.now()});return drawImage.call(this,source,...a);};let last=0;
  function frame(t){if(last)s.frames.push({at:t,ms:t-last});last=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  s.longTasksSupported=PerformanceObserver.supportedEntryTypes?.includes('longtask')||false;if(s.longTasksSupported)new PerformanceObserver(list=>{for(const e of list.getEntries())s.tasks.push({at:e.startTime,ms:e.duration});}).observe({type:'longtask',buffered:true});
  const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url,async=true,...a){this._profileSync=!async;this._profileURL=String(url);return open.call(this,method,url,async,...a);};
  XMLHttpRequest.prototype.send=function(...a){const at=performance.now();try{return send.apply(this,a);}finally{if(this._profileSync)s.xhr.push({at,ms:performance.now()-at,url:this._profileURL,bytes:this.responseText?.length||0});}};
  const dispatch=window.dispatchEvent.bind(window);window.dispatchEvent=e=>{const at=performance.now();try{return dispatch(e);}finally{if(e.type==='goonk-state')s.handlers.push({at,ms:performance.now()-at});}};
  const timer=setInterval(()=>{const node=window.Module?.SDL2?.audio?.scriptProcessorNode;if(node?.onaudioprocess&&!node._profile){node._profile=true;const fn=node.onaudioprocess;let last;node.onaudioprocess=e=>{const at=performance.now();if(last)s.audio.push({at,ms:at-last});last=at;return fn.call(node,e);};}},200);
 });
 console.log('Opening private game');
 await (await import('./silent-audio.mjs')).silenceTestAudio(page);await page.goto((process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8777')+'/game.html?mobile=1');
 const wait=(f,arg)=>page.waitForFunction(f,arg,{timeout:45000}),cmd=(...a)=>page.evaluate(a=>Module._vcmiMobileCommand(...a),[...a,...Array(6-a.length).fill(0)]);
 await page.waitForFunction(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,{timeout:180000});assert(await page.evaluate(()=>Module.goonkTemporaryStorage));
 const cdp=kind==='chromium'?await context.newCDPSession(page):null;if(process.env.CPU_RATE)await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.CPU_RATE)});
 await page.keyboard.press('Shift');
 await page.evaluate(()=>{const ctx=Module.SDL2.audioContext;const meter=window.privateAudioMeter=ctx.createAnalyser();meter.fftSize=2048;const silent=ctx.createGain();silent.gain.value=0;Module.SDL2.audio.scriptProcessorNode.connect(meter);meter.connect(silent);silent.connect(ctx.destination);});
 async function phase(name,fn,settle=1200){const at=await page.evaluate(()=>performance.now());if(fn)await fn();await page.waitForTimeout(settle);const data=await page.evaluate(at=>{
  const summarize=a=>{const v=a.filter(x=>x.at>=at).map(x=>x.ms).sort((a,b)=>a-b);return{n:v.length,max:v.at(-1)||0,p95:v[Math.floor(v.length*.95)]||0,over50:v.filter(x=>x>50).length,over100:v.filter(x=>x>100).length};};
  const waveform=new Float32Array(2048);privateAudioMeter.getFloatTimeDomainData(waveform);const audioPeak=Math.max(...waveform.map(Math.abs));
  return{longTasksSupported:profile.longTasksSupported,audioPeak,webglReadbacks:profile.glReads.filter(x=>x.at>=at).length,previewAtlasVersion:window.goonkCreaturePreviewVersion||0,audioBufferMs:Module.SDL2?.audio?.scriptProcessorNode?.bufferSize/Module.SDL2?.audioContext?.sampleRate*1000,frames:summarize(profile.frames),audio:summarize(profile.audio),tasks:summarize(profile.tasks),handlers:summarize(profile.handlers),xhr:profile.xhr.filter(x=>x.at>=at),wasmMB:Module.HEAPU8.byteLength/1048576,audioState:Module.SDL2?.audioContext?.state};},at);report.phases.push({name,...data});console.log(name,JSON.stringify({...data,xhr:data.xhr.length}));fs.writeFileSync(output,JSON.stringify(report,null,2));}
 let fixture=process.env.EXTENDED?execFileSync('python3',['-c',`import zipfile,json,io,sys
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='objects.json':
   objects=json.loads(data)
   for obj in objects:
    if obj.get('instanceName')=='goonkTown':obj['options']['buildings']['allOf']+=['goonk:mageGuild1','goonk:marketplace']
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]):fs.readFileSync('maps/000-Goonk.vmap');
 const fixtureDir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-private-fixture-'));
 try{const file=path.join(fixtureDir,'fixture.vmap');fs.writeFileSync(file,fixture);execFileSync('python3',['scripts/normalize-map-instances.py',fixtureDir]);fixture=fs.readFileSync(file);}finally{fs.rmSync(fixtureDir,{recursive:true,force:true});}
 await page.evaluate(bytes=>Module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/001-Goonks.vmap',new Uint8Array(bytes)),[...fixture]);
 await phase('new-game',async()=>{await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);await cmd(21);await wait(()=>goonkMobileState.selectedMap?.startsWith('000'));await cmd(22);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);});
 await phase('map-idle',null,3000);
 await phase('town-open',async()=>{await cmd(5);await wait(()=>goonkMobileState.mode==='town');});
 await phase('recruitment-open',async()=>{await page.locator('[data-ui=town-fort]').tap();await wait(()=>goonkMobileState.mode==='fort');});
 if(process.env.CPU_PROFILE){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 const ids=await page.locator('[data-family-select]').evaluateAll(es=>es.slice(0,8).map(e=>e.dataset.familySelect));
 for(const [name,delay]of [['recruitment-fast',70],['recruitment-settled',400],['recruitment-repeat',400]])await phase(name,async()=>{for(let i=0;i<24;i++){await page.locator('[data-family-select="'+ids[i%ids.length]+'"]').evaluate(e=>e.click());await page.waitForTimeout(delay);}});
 if(process.env.CPU_PROFILE){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(output+'.cpuprofile',JSON.stringify(profile));}
 if(process.env.EXTENDED){
  await phase('preview-animation',async()=>{const b=page.locator('[data-family-select]').first();await b.tap();const id=Number(await b.getAttribute('data-family-select'));await wait(id=>window.goonkCreaturePreviewRects?.has(id),id);const hashes=new Set();for(let i=0;i<6;i++){await page.waitForTimeout(150);hashes.add(crypto.createHash('sha256').update(await b.locator('canvas').screenshot()).digest('hex'));}assert(hashes.size>1,'Native atlas animation must remain alive');});
 }
 if(!process.env.RECRUIT_ONLY){
 await phase('creature-detail',async()=>{await page.locator('[data-type-info]').tap();await wait(()=>goonkMobileState.mode==='creature');await page.locator('[data-presentation-close]').tap();await wait(()=>goonkMobileState.mode==='fort');});
 await cmd(43);await wait(()=>goonkMobileState.mode==='town');await cmd(0);await wait(()=>goonkMobileState.mode==='map');
 await phase('hero-sheet',async()=>{await page.locator('[data-ui=heroes]').tap();await wait(()=>goonkMobileState.mode==='hero');await page.locator('[data-hero-tab=army]').tap();await page.locator('[data-hero-close]').tap();await wait(()=>goonkMobileState.mode==='map');});
 await phase('combat-entry',async()=>{await page.evaluate(()=>Module._vcmiMobilePointer(433,281,1));await wait(()=>goonkMobileState.hasPath);await page.locator('[data-ui=move]').tap();await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct);});
 await phase('combat-actions',async()=>{await page.locator('[data-ui=battle-auto]').tap();await wait(()=>goonkMobileState.mode!=='battle');},2000);
 if(process.env.EXTENDED){
  for(let i=0;i<5&&await page.evaluate(()=>goonkMobileState.mode==='dialog');i++){await cmd(1);await page.waitForTimeout(250);}
  await wait(()=>goonkMobileState.mode==='map');
  await phase('town-buildings',async()=>{await cmd(5);await wait(()=>goonkMobileState.mode==='town');const id=await page.evaluate(()=>goonkMobileState.buildings.find(b=>b.allowed&&!b.built&&b.key.endsWith(':townHall')).id);await cmd(8,id);await page.waitForFunction(id=>goonkMobileState.buildings.some(b=>b.id===id&&b.built),id,{timeout:10000});});
  await phase('mage-guild',async()=>{await page.locator('[data-ui=town-guild]').tap();await page.locator('[data-guild-close]').waitFor();await page.locator('[data-guild-close]').tap();await wait(()=>goonkMobileState.mode==='town');});
  await phase('marketplace',async()=>{await page.locator('[data-ui=town-market]').tap();await page.locator('[data-market=close]').waitFor();await page.locator('[data-market=close]').tap();await wait(()=>goonkMobileState.mode==='town');});
  await phase('recruit-purchase',async()=>{await cmd(54);await wait(()=>goonkMobileState.mode==='fort');const id=await page.locator('[data-family-select]:not([data-locked])').first().getAttribute('data-family-select');await page.locator('[data-family-select="'+id+'"]').evaluate(e=>e.click());const before=await page.evaluate(id=>({stock:goonkMobileState.fortFamilies.find(f=>f.variants.some(u=>u.id===Number(id))).count,gold:goonkMobileState.resources[6]}),id);await page.locator('[data-hall-buy]').tap();await wait(({id,before})=>goonkMobileState.fortFamilies.find(f=>f.variants.some(u=>u.id===Number(id))).count===before.stock-1&&goonkMobileState.resources[6]<before.gold,{id,before});await cmd(43);await wait(()=>goonkMobileState.mode==='town');});
  await phase('hall-reopen',async()=>{for(let i=0;i<4;i++){await cmd(54);await wait(()=>goonkMobileState.mode==='fort');await page.locator('[data-family-select]').nth(i).evaluate(e=>e.click());await page.waitForTimeout(450);await cmd(43);await wait(()=>goonkMobileState.mode==='town');}});
  await phase('audio-resume',async()=>{await page.evaluate(()=>Module.SDL2.audioContext.suspend());await page.keyboard.press('Shift');await wait(()=>Module.SDL2.audioContext.state==='running');});
  await phase('rotations',async()=>{for(const size of [{width:844,height:390},{width:768,height:1024},{width:1024,height:768},{width:390,height:844}]){await page.setViewportSize(size);await page.waitForTimeout(400);}});
  await cmd(0);await wait(()=>goonkMobileState.mode==='map');
  await phase('temporary-save',async()=>{const count=await page.evaluate(()=>goonkRuntimeStats.saves.length);await cmd(7);await wait(n=>goonkRuntimeStats.saves.length>n,count);assert(await page.evaluate(()=>goonkRuntimeStats.saves.at(-1).ok));});
  await wait(()=>goonkMobileState.mode==='dialog');await cmd(1);await wait(()=>goonkMobileState.mode==='map');
  await phase('next-day',async()=>{const day=await page.evaluate(()=>goonkMobileState.day);await cmd(3);for(let i=0;i<8;i++){await wait(day=>goonkMobileState.mode==='dialog'||goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day>day,day);if(await page.evaluate(()=>goonkMobileState.mode==='dialog'))await cmd(1);else break;}await wait(day=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day>day,day);});
 }
 }
 if(!process.env.CACHE_FIX_ONLY)for(const phase of report.phases.filter(p=>['recruitment-fast','recruitment-settled','recruitment-repeat'].includes(p.name))){assert.equal(phase.webglReadbacks,0,'No GPU readback during '+phase.name);assert(phase.frames.max<100,'No sustained UI freeze during '+phase.name);assert(phase.audioPeak>0,'Real audio signal during '+phase.name);}
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){for(const page of browser.contexts().flatMap(c=>c.pages())){report.nativeLog=await page.evaluate(()=>{try{return Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}).split('\n').filter(l=>/ERROR|FATAL|EndTurn|NewTurn|YourTurn|BuildStructure|NewStructures|SaveGame|InfoWindow|QueryReply/.test(l)).slice(-100).join('\n');}catch{return'';}}).catch(()=>null);report.last=await page.evaluate(()=>({state:window.goonkMobileState,recovery:window.goonkSessionRecovery,body:document.body.innerText.slice(-1500)})).catch(()=>null);await page.screenshot({path:output+'.png'}).catch(()=>{});}report.failure=e.stack;process.exitCode=1;console.error(e.stack);}finally{fs.writeFileSync(output,JSON.stringify(report,null,2));await browser.close();}
