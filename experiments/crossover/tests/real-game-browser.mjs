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
  await page.goto(process.env.CROSSOVER_URL||'http://127.0.0.1:8778/crossover/index.html');
  await page.locator('#observe').click();
  await page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('mode menu'),null,{timeout:180000});
  const sc=page.frames().find(frame=>frame.url().includes('/starcraft/index.html'));
  const heroes=page.frames().find(frame=>frame.url().includes('/game.html'));
  assert(sc&&heroes);
  await sc.locator('#archive-files').setInputFiles(files);
  await sc.waitForFunction(()=>!document.querySelector('#start-game').disabled,null,{timeout:60000});
  await sc.locator('#start-game').click();
  await sc.waitForFunction(()=>window.openbwCrossover?.sample().frame>24,null,{timeout:120000});
  await page.waitForFunction(()=>document.querySelector('#transfer').textContent.includes('→ journal natif StarCraft'),null,{timeout:15000});
  await sc.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Heroes: menu'),null,{timeout:15000});
  report.cases.push({name:'Both native engines running; actual Heroes menu event reaches native OpenBW log; native state returns to bridge',sample:await sc.evaluate(()=>window.openbwCrossover.sample())});
  await heroes.evaluate(()=>window.Module._vcmiMobileCommand(20,1,0,0,0,0));
  await page.waitForFunction(()=>document.querySelector('#transfer').textContent.includes('(lobby)'),null,{timeout:60000});
  await sc.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Heroes: lobby'),null,{timeout:15000});
  report.cases.push('Native VCMI command changes mode; transition is applied to native OpenBW message log');
  const before=await sc.evaluate(()=>{
    const x=window.testOpenBW,read=ptr=>{const bytes=new Uint8Array(x.memory.buffer);let end=ptr;while(bytes[end])end++;return new TextDecoder().decode(bytes.subarray(ptr,end));};
    const units=read(x.openbw_debug_units()).trim().split('\n').map(line=>{const [id,type,owner,px,py,order]=line.split('\t');return {id:+id,type,owner:+owner,x:+px,y:+py,order:+order};});
    const base=units.find(u=>u.type.includes('Command Center'));if(!base)throw Error('Terran base not found');
    x.openbw_debug_select(base.id,0); // Normal selection path only; no game-state injection.
    return {workers:units.filter(u=>u.type.includes('SCV')).length,frame:x.openbw_frame()};
  });
  const trainSCV=sc.locator('#card .cmd').filter({hasText:/SCV/i}).first();
  await trainSCV.waitFor({timeout:15000});
  await trainSCV.click();
  await sc.waitForFunction(count=>{
    const x=window.testOpenBW,p=x.openbw_debug_units(),bytes=new Uint8Array(x.memory.buffer);let end=p;while(bytes[end])end++;
    return new TextDecoder().decode(bytes.subarray(p,end)).split('\n').filter(line=>line.includes('SCV')).length>count;
  },before.workers,{timeout:90000});
  report.cases.push('Actual command card trains an additional SCV under native economy and production rules');
  const replay=await sc.evaluate(()=>{const x=window.testOpenBW,p=x.openbw_save_replay(),length=x.openbw_replay_len();if(!p||length<=0)throw Error('No native replay');return {length,frame:x.openbw_frame()};});
  report.cases.push({name:'Native replay serialization produces bytes (not a save/resume test)',...replay});
  assert.deepEqual(errors,[]);await page.screenshot({path:out+'/native-crossover.png',fullPage:true});report.passed=true;
}catch(e){report.passed=false;report.error=String(e);process.exitCode=1;await page?.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));
