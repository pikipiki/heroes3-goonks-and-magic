// Requires actual player-owned MPQs. Never substitutes header fixtures or simulation data.
import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
if(!process.env.STARCRAFT_DATA_DIR)throw Error('Set STARCRAFT_DATA_DIR to the folder containing your three MPQ archives.');
const names=fs.readdirSync(process.env.STARCRAFT_DATA_DIR);
const files=['stardat.mpq','broodat.mpq','patch_rt.mpq'].map(name=>{
  const file=names.find(value=>value.toLowerCase()===name);if(!file)throw Error('Missing '+name);
  return path.join(process.env.STARCRAFT_DATA_DIR,file);
});
const out=process.env.REVIEW_OUTPUT||'/private/tmp/heroes-starcraft-real-game-review';fs.mkdirSync(out,{recursive:true});
const report={scope:'Actual VCMI and OpenBW WASM, actual player archives, no injected simulation state',cases:[]};
function record(value){report.cases.push(value);fs.writeFileSync(out+'/progress.json',JSON.stringify(report,null,2));console.log(typeof value==='string'?value:value.name);}
const browser=await chromium.launch({headless:true});let page;
try{
  page=await browser.newPage({viewport:{width:1280,height:900}});await silenceTestAudio(page);
  await page.addInitScript(()=>{
    sessionStorage.setItem('heroes-goonk.storage-failed','true');
    // Read-only instrumentation lives only in this test context, never the shipped host.
    for(const name of ['instantiate','instantiateStreaming']){
      const original=WebAssembly[name].bind(WebAssembly);
      WebAssembly[name]=async(...args)=>{const result=await original(...args);const instance=result.instance||result;if(instance.exports?.openbw_frame)window.testOpenBW=instance.exports;return result;};
    }
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text().slice(0,1600)+'\n'));
  page.on('requestfailed',r=>fs.appendFileSync(out+'/console.log','FAILED '+r.url()+' '+r.failure()?.errorText+'\n'));
  await page.goto(process.env.CROSSOVER_URL||'http://127.0.0.1:8778/crossover/index.html');
  await page.locator('#observe').click();
  await page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('mode menu'),null,{timeout:180000});
  const sc=page.frames().find(frame=>frame.url().includes('/starcraft/index.html'));
  const heroes=page.frames().find(frame=>frame.url().includes('/game.html'));
  assert(sc&&heroes);
  if(!process.env.STARCRAFT_AUTO_DOWNLOAD)await sc.locator('#archive-files').setInputFiles(files);
  await sc.waitForFunction(()=>!document.querySelector('#start-game').disabled,null,{timeout:60000});
  await page.locator('#starcraft-frame').scrollIntoViewIfNeeded();
  await sc.locator('#start-game').click();
  await sc.waitForFunction(()=>window.openbwCrossover?.sample().frame>24,null,{timeout:120000});
  await page.waitForFunction(()=>document.querySelector('#transfer').textContent.includes('→ journal natif StarCraft'),null,{timeout:15000});
  await sc.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Heroes: menu'),null,{timeout:15000});
  record({name:'Both native engines running; actual Heroes menu event reaches native OpenBW log; native state returns to bridge',sample:await sc.evaluate(()=>window.openbwCrossover.sample())});
  await page.locator('#prepare-heroes').click();
  await page.waitForFunction(()=>document.querySelector('#prepare-result').textContent.includes('VCMI a confirmé'));
  await heroes.waitForFunction(()=>window.goonkMobileState?.mode==='lobby'&&window.goonkMobileState?.lobbyReady);
  await page.waitForFunction(()=>document.querySelector('#transfer').textContent.includes('(lobby)'),null,{timeout:60000});
  await sc.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Heroes: lobby'),null,{timeout:15000});
  record('Real StarCraft sample triggers native VCMI preparation command; VCMI confirms lobby and sends its transition back to native OpenBW log');
  await page.locator('#starcraft-frame').scrollIntoViewIfNeeded();
  const before=await sc.evaluate(()=>{
    const x=window.testOpenBW;
    window.testRead=ptr=>{const bytes=new Uint8Array(x.memory.buffer);let end=ptr;while(bytes[end])end++;return new TextDecoder().decode(bytes.subarray(ptr,end));};
    window.testUnits=()=>window.testRead(x.openbw_debug_units()).trim().split('\n').map(line=>{const [id,type,owner,px,py,order]=line.split('\t');return {id:+id,type,owner:+owner,x:+px,y:+py,order:+order};});
    const units=window.testUnits(),base=units.find(u=>u.type.includes('Command Center'));
    if(!base)throw Error('Terran base not found');
    x.openbw_debug_select(base.id,0); // Normal selection path only; no game-state injection.
    return {workers:units.filter(u=>u.type.includes('SCV')).length,frame:x.openbw_frame(),minerals:+window.testRead(x.openbw_resources()).split('\t')[0]};
  });
  const trainSCV=sc.locator('#card .cmd').filter({hasText:/SCV/i}).first();
  await trainSCV.waitFor({timeout:15000});
  await trainSCV.click();
  await sc.waitForFunction(()=>window.testRead(window.testOpenBW.openbw_status()).includes('SCV'),null,{timeout:10000});
  const queued=await sc.evaluate(()=>({frame:window.testOpenBW.openbw_frame(),minerals:+window.testRead(window.testOpenBW.openbw_resources()).split('\t')[0]}));
  assert.equal(before.minerals-queued.minerals,50,'Native economy charges one SCV');
  // A unit exists internally while being trained. Count growth alone is NOT completion.
  await sc.waitForFunction(count=>window.testRead(window.testOpenBW.openbw_status())===''&&window.testUnits().filter(u=>u.type.includes('SCV')).length===count+1,before.workers,{timeout:90000});
  const completed=await sc.evaluate(()=>{const state=window.openbwCrossover.census();return {frame:state.frame,workers:state.units.filter(u=>u.type===7&&u.completed&&u.hp>0).length};});
  assert.equal(completed.workers,before.workers+1,'Native completion flag must be set');
  assert(completed.frame>queued.frame+1);
  record({name:'Native SCV production completes, queue empties and exactly 50 minerals are spent',before,queued,completed});
  // Camera and unit coordinates come from the explicit native DTO, never guessed.
  async function nativeTarget(point){
    return sc.evaluate(point=>{
      const x=window.testOpenBW,w=x.openbw_framebuffer_width(),h=x.openbw_framebuffer_height();
      x.openbw_mouse_move(w/2,h/2);x.openbw_render(performance.now());
      const view=window.openbwCrossover.census().view;
      const cx=Math.max(0,Math.min(x.openbw_map_w()*32-view.width,point.x-view.width/2)),cy=Math.max(0,Math.min(x.openbw_map_h()*32-view.height,point.y-view.height/2));
      x.openbw_pan(cx-view.x,cy-view.y);x.openbw_render(performance.now());
      const actual=window.openbwCrossover.census().view;
      const sx=Math.round((point.x-actual.x)*w/actual.width),sy=Math.round((point.y-actual.y)*h/actual.height);
      x.openbw_mouse_move(sx,sy);x.openbw_mouse_button(1,1,sx,sy,1);x.openbw_mouse_button(0,1,sx,sy,1);x.openbw_render(performance.now());
      return {world:point,screen:{x:sx,y:sy},camera:actual};
    },point);
  }
  const worker=await sc.evaluate(()=>window.testUnits().find(u=>u.type.includes('SCV')));
  await sc.evaluate(id=>window.testOpenBW.openbw_debug_select(id,0),worker.id);
  const move=sc.locator('#card .cmd .lbl').filter({hasText:/^Move$/i});
  await move.waitFor({timeout:10000});await move.click();
  const moveTarget=await nativeTarget({x:worker.x+96,y:worker.y+64});
  await sc.waitForFunction(original=>{const u=window.testUnits().find(u=>u.id===original.id);return u&&Math.abs(u.x-original.x)+Math.abs(u.y-original.y)>=32;},worker,{timeout:30000});
  record({name:'Real Move command changes native worker position through engine pathfinding',target:moveTarget,before:worker,after:await sc.evaluate(id=>window.testUnits().find(u=>u.id===id),worker.id)});
  // Force attack is an original StarCraft command, including on own units. No HP writes.
  const combat=await sc.evaluate(moved=>{const workers=window.testUnits().filter(u=>u.type.includes('SCV')&&u.id!==moved),target=workers[0];return {target,attackers:workers.slice(1,3),workers:workers.length+1};},worker.id);
  await sc.evaluate(ids=>ids.forEach((id,i)=>window.testOpenBW.openbw_debug_select(id,i?1:0)),combat.attackers.map(u=>u.id));
  const attack=sc.locator('#card .cmd .lbl').filter({hasText:/^Attack$/i});await attack.waitFor({timeout:10000});await attack.click();
  await nativeTarget(combat.target);
  await sc.waitForFunction(id=>!window.testUnits().some(u=>u.id===id),combat.target.id,{timeout:90000});
  const afterCombat=await sc.evaluate(()=>({frame:window.testOpenBW.openbw_frame(),workers:window.testUnits().filter(u=>u.type.includes('SCV')).length,sample:window.openbwCrossover.sample()}));
  assert.equal(afterCombat.workers,combat.workers-1);
  assert.equal(afterCombat.sample.cohort.missing,1);
  assert(afterCombat.sample.cohort.missingIds.includes(combat.target.id));
  await page.waitForFunction(()=>document.querySelector('#sc-detail').textContent.includes('1 absente(s)'));
  record({name:'Native force-attack combat removes exactly one real SCV; no health or outcome injection',target:combat.target.id,beforeWorkers:combat.workers,after:afterCombat});
  // Both engines now enter actual gameplay, not just the Heroes menu/lobby.
  await heroes.evaluate(()=>window.Module._vcmiMobileCommand(22,0,0,0,0,0));
  await heroes.waitForFunction(()=>window.goonkMobileState?.mode==='map'&&window.goonkMobileState?.turn,null,{timeout:180000});
  await sc.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Heroes: map'),null,{timeout:15000});
  const heroesGame=await heroes.evaluate(()=>{const s=window.goonkMobileState;return {mode:s.mode,heroId:s.heroId,armies:s.armies,day:s.day};});
  assert(heroesGame.armies?.some(army=>army.slots?.some(unit=>unit?.count>0)),'Native Heroes army must exist');
  record({name:'Actual Heroes world starts alongside active StarCraft; native map event reaches OpenBW',heroes:heroesGame});
  await heroes.evaluate(()=>window.Module._vcmiMobileCommand(34,701,0,0,0,0));
  await heroes.waitForFunction(()=>{try{return window.Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').size>0;}catch{return false;}},null,{timeout:30000});
  record({name:'VCMI serializes an actual local save while the StarCraft simulation continues',bytes:await heroes.evaluate(()=>window.Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').size)});
  const replay=await sc.evaluate(()=>{const x=window.testOpenBW,p=x.openbw_save_replay(),length=x.openbw_replay_len();if(!p||length<=0)throw Error('No native replay');return {length,frame:x.openbw_frame()};});
  record({name:'Native replay serialization produces bytes (not a save/resume test)',...replay});
  assert.deepEqual(errors,[]);await page.screenshot({path:out+'/native-crossover.png',fullPage:true});report.passed=true;
}catch(e){report.passed=false;report.error=String(e);process.exitCode=1;
  report.native=await page?.frames().find(f=>f.url().includes('/starcraft/index.html'))?.evaluate(()=>window.testOpenBW?{sample:window.openbwCrossover?.sample(),units:window.testUnits?.(),selection:window.testRead?.(window.testOpenBW.openbw_debug_dump()),census:window.openbwCrossover?.census()}:null).catch(String);
  report.frames=await Promise.all((page?.frames()||[]).map(async f=>({url:f.url(),text:await f.locator('body').innerText({timeout:3000}).then(v=>v.slice(-6000)).catch(String)})));
await page?.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));
