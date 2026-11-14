import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const out=process.env.REVIEW_OUTPUT || '/private/tmp/heroes-crossover-review';
fs.mkdirSync(out,{recursive:true});
let activePage;
const result={scope:process.env.CROSSOVER_LAUNCHER_ONLY==='1'?'Actual Chromium, static launcher only; no engine started.':'Actual Chromium, launcher and existing VCMI WASM. No StarCraft simulation.',cases:[]};
try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  activePage=page;
  await silenceTestAudio(page);
  page.on('console',m=>fs.appendFileSync(out+'/console.log',m.type()+': '+m.text().slice(0,1500)+'\n'));
  page.on('requestfailed',r=>fs.appendFileSync(out+'/console.log','FAILED '+r.url()+' '+r.failure()?.errorText+'\n'));
  // Exercise the existing temporary-storage fallback to avoid a full OPFS import in an ephemeral context.
  await page.addInitScript(()=>sessionStorage.setItem('heroes-goonk.storage-failed','true'));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.CROSSOVER_URL || 'http://127.0.0.1:8774/crossover/');
  await page.locator('#observe').waitFor();
  assert.equal(await page.getByRole('link',{name:'Jouer à StarCraft'}).getAttribute('href'),'./starcraft/index.html');
  assert.equal(await page.getByRole('link',{name:'Jouer à Heroes Goonk'}).getAttribute('href'),'../game.html');
  assert.equal(await page.locator('iframe').count(),0);
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1280,height:900}]){
    await page.setViewportSize(viewport);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.screenshot({path:out+'/launcher.png',fullPage:true});
  result.cases.push('Three modes rendered; StarCraft link present; no engine loaded before action; phone/landscape/desktop fit');
  if(process.env.CROSSOVER_LAUNCHER_ONLY!=='1'){
  await page.locator('#observe').click();
  assert.equal(await page.locator('iframe').count(),2);
  await page.waitForFunction(()=>document.querySelector('#status').textContent==='État VCMI reçu en lecture seule.',null,{timeout:180000});
  const first=await page.locator('#detail').textContent();
  assert.match(first,/mode /);
  const frame=page.frames().find(f=>f.url().includes('/game.html'));
  assert(frame);
  const engine=await frame.evaluate(()=>({wasm:!!window.Module?._vcmiMobileCommand,mode:window.goonkMobileState?.mode}));
  assert.equal(engine.wasm,true);
  result.cases.push({name:'Actual native WASM event observed in same-origin iframe',detail:first,engine});
  await frame.waitForFunction(()=>window.goonkMobileState?.mode==='menu',null,{timeout:60000});
  await frame.evaluate(()=>window.Module._vcmiMobileCommand(20,1,0,0,0,0));
  await frame.waitForFunction(()=>window.goonkMobileState?.mode==='lobby'&&window.goonkMobileState?.lobbyReady,null,{timeout:60000});
  await page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('mode lobby'));
  result.cases.push('Native command 20 opens the real Heroes lobby and the observer receives its new mode');
  await page.screenshot({path:out+'/native-observation.png',fullPage:true});
  await page.locator('#stop').click();
  assert.equal(await page.locator('iframe').count(),0);
  assert.equal(await page.locator('#observe').isEnabled(),true);
  await page.reload();
  assert.equal(await page.locator('iframe').count(),0);
  result.cases.push('Stop removes engine; reload does not fabricate or restore a simulation');
  }
  assert.deepEqual(errors,[]);
  result.passed=true;
} catch(e){result.passed=false;result.error=String(e);process.exitCode=1;
  await activePage?.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});
  result.frames=await Promise.all((activePage?.frames()||[]).map(async f=>({url:f.url(),text:await f.locator('body').innerText({timeout:3000}).catch(String)})));
}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));await browser.close();}
console.log(JSON.stringify(result,null,2));
