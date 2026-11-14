import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';import assert from 'node:assert/strict';import fs from 'node:fs';
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1000,height:700}});await silenceTestAudio(page);
const report={scope:'Real OpenBW combat, scenario initialization only; no health or outcome injection',snapshots:[]};
try{
 await page.goto('http://127.0.0.1:8778/crossover/starcraft/index.html');
 await page.waitForFunction(()=>!document.querySelector('#start-game').disabled,null,{timeout:180000});
 await page.evaluate(()=>window.openbwLaunchCrossover({version:1,battleId:17,stacks:[{id:0,side:0,count:12,unit:0},{id:1,side:0,count:6,unit:37},{id:2,side:1,count:20,unit:37}]}));
 await page.waitForFunction(()=>!!window.openbwCrossover?.battle());
 assert.equal(await page.evaluate(()=>window.openbwCrossover.battle().frame),0);
 report.snapshots.push(await page.evaluate(()=>window.openbwCrossover.battle()));
 await page.evaluate(()=>{window.openbwCrossover.start();window.openbwCrossover.attack();});
 await page.waitForFunction(()=>window.openbwCrossover?.battle()?.finished,null,{timeout:30000});
 const result=await page.evaluate(()=>window.openbwCrossover.battle());assert(result.groups.some(row=>row.survivors<row.initial));report.snapshots.push(result);report.passed=true;
}catch(e){report.passed=false;report.error=String(e);process.exitCode=1;report.native=await page.evaluate(()=>({battle:window.openbwCrossover?.battle(),census:window.openbwCrossover?.census()})).catch(()=>null);report.messages=await page.locator('#msg').textContent().catch(()=>null);}
finally{fs.writeFileSync(new URL('../evidence/rts-battle.json',import.meta.url),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report,null,2));
