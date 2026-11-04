import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {parseTumNativeLog} from './tum-native-diagnostics.mjs';
const project=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/hero-paths-map-proof');
fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(project+'/work/browser-tests/package.json')('playwright-core');
const browser=await chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9227');
const context=await browser.newContext({viewport:{width:390,height:844}}),anchor=await context.newPage();
await anchor.goto('about:blank');
const origin=process.env.GAME_ORIGIN||'http://127.0.0.1:8796',report={cases:[]};
const state=p=>p.evaluate(()=>structuredClone(goonkMobileState));
const cmd=(p,...a)=>p.evaluate(a=>Module._vcmiMobileCommand(...a.concat(Array(6-a.length).fill(0))),a);
const wait=(p,f,arg)=>p.waitForFunction(f,arg,{timeout:900000});
try{
 for(const [name,x,y]of [['000 - Château Goonk',11,11],['Goonks',22,24]]){
  const p=await context.newPage(),r={name,errors:[]};p.on('pageerror',e=>r.errors.push(e.message));
  try{
   await p.goto(origin+'/game.html?mobile=1&choose-save=1');
   await wait(p,()=>window.goonkMobileState?.mode==='load'&&goonkMobileState.lobbyReady);
   assert.equal(await p.evaluate(()=>typeof window.heroPathsPoc),'undefined');
   await p.locator('[data-ui=back]').click();await wait(p,()=>goonkMobileState.mode==='menu');
   await p.locator('[data-action="20"]').click();await wait(p,n=>goonkMobileState.maps?.some(m=>m.name===n),name);
   const entry=(await state(p)).maps.find(m=>m.name===name);
   await p.locator('#mobile-map-select').selectOption(String(entry.index));
   await p.locator('[data-ui=begin]').click();await wait(p,()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
   await cmd(p,4,0);await p.waitForTimeout(200);const before=await state(p);r.before={day:before.day,gold:before.resources[6]};
   if(name==='Goonks'){
    assert.equal(before.mapOverview.width,144);assert(before.heroes.length>0);
    await p.screenshot({path:out+'/duel-start.png'});r.startVerified=true;
    r.limit='Duel verifies normal start and native map load; sanctuary approaches covered by BFS, rewards by four native fixture cases';
   }else{
    const o=before.mapOverview;
    await p.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:o.view.x+(x-o.viewport.x)*32,y:o.view.y+(y-o.viewport.y)*32});
    await wait(p,()=>goonkMobileState.hasPath);await p.locator('[data-ui=move]').click();
    await wait(p,()=>goonkMobileState.mode==='dialog');await p.screenshot({path:out+'/showcase-level-gate.png'});
    await cmd(p,1);await wait(p,()=>goonkMobileState.mode==='map');
    const after=await state(p);assert.equal(after.resources[6],before.resources[6]);assert.equal(after.day,before.day);r.sanctuaryVisitVerified=true;
   }
   const log=await p.evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
   const entries=parseTumNativeLog(log);r.nativeErrors=entries.filter(e=>['ERROR','FATAL'].includes(e.level));r.knownMapDiagnostics=r.nativeErrors.filter(e=>/Cannot pick native hero for (red|blue)\. Picking any|Cannot give starting artifact - no heroes!/.test(e.text));r.unexpectedNativeErrors=r.nativeErrors.filter(e=>!r.knownMapDiagnostics.includes(e));r.warnings=entries.filter(e=>e.level==='WARN');
   fs.writeFileSync(out+'/'+(name==='Goonks'?'duel':'showcase')+'-client.log',log);assert.deepEqual(r.errors,[]);assert.deepEqual(r.unexpectedNativeErrors,[]);r.passed=true;
  }catch(e){r.failure=e.stack;process.exitCode=1;await p.screenshot({path:out+'/failure.png'}).catch(()=>{});}
  finally{report.cases.push(r);fs.writeFileSync(out+'/map-smoke-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({name,passed:r.passed,error:r.failure?.split('\n')[0]}));await p.close();}
 }
}finally{await anchor.close();await context.close();await browser.close();}
