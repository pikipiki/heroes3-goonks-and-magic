import {chromium} from '../../../work/browser-tests/node_modules/playwright-core/index.mjs';
import {silenceTestAudio} from '../../../work/browser-tests/silent-audio.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';
const out='/private/tmp/heroes-starcraft-adventure-review';fs.mkdirSync(out,{recursive:true});
const report={scope:'Published trial map, native Heroes attack, real OpenBW combat, native Heroes casualty application; no injected game state',cases:[]};
const save=()=>fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2)+'\n');
const record=value=>{report.cases.push(value);save();console.log(value.name||value);};
fs.writeFileSync(out+'/console.log','');
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1180,height:760}});await silenceTestAudio(page);
await page.addInitScript(()=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');
 window.addEventListener('goonk-crossover-submitted',e=>window.testCrossoverSubmission=structuredClone(e.detail));
});
page.on('console',message=>fs.appendFileSync(out+'/console.log',message.type()+': '+message.text().slice(0,2000)+'\n'));
let hero;
const cmd=async(...args)=>hero.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
try{
 await page.goto('http://127.0.0.1:8779/index.html');await page.locator('#trial').click();
 await page.waitForFunction(()=>[...document.querySelectorAll('iframe')].some(frame=>frame.title==='Heroes — combats StarCraft'));
 hero=page.frames().find(frame=>frame.url().includes('/game.html'));
 await hero.waitForFunction(()=>window.goonkMobileState?.mode==='map'&&goonkMobileState.turn&&goonkMobileState.crossoverEnabled,null,{timeout:180000});
 record({name:'One click launches the published trial map inside Heroes with crossover mode enabled',state:await hero.evaluate(()=>({heroId:goonkMobileState.heroId,day:goonkMobileState.day}))});
 await cmd(6);await hero.waitForTimeout(200);
 await hero.evaluate(()=>{const view=goonkMobileState.mapOverview.view;Module._vcmiMobilePointer(view.x+view.w/2+64,view.y+view.h/2,1);});
 await hero.waitForFunction(()=>goonkMobileState.hasPath);await cmd(2);
 await hero.waitForFunction(()=>!!goonkMobileState.crossover,null,{timeout:60000});
 const initial=await hero.evaluate(()=>structuredClone(goonkMobileState.crossover));report.initial=initial;save();
 await hero.locator('#crossover-arena').waitFor();
 const sc=hero.childFrames().find(frame=>frame.url().includes('/starcraft/index.html'));assert(sc);
 await sc.waitForFunction(()=>!!window.openbwCrossover?.battle(),null,{timeout:180000});
 assert.equal(await sc.evaluate(()=>window.openbwCrossover.battle().frame),0,'RTS waits for the player before fighting');
 record({name:'Real Heroes attack is suspended and its exact armies initialize native StarCraft',heroes:initial,starcraft:await sc.evaluate(()=>window.openbwCrossover.battle())});
 await hero.locator('#crossover-attack').click();
 await hero.waitForFunction(()=>window.testCrossoverSubmission,null,{timeout:120000});
 const submission=await hero.evaluate(()=>window.testCrossoverSubmission);report.submission=submission;save();
 assert(submission.result.finished);assert(submission.result.groups.some(row=>row.survivors<row.initial));
 await hero.waitForFunction(()=>goonkMobileState.dialogKind==='battle-result',null,{timeout:60000});
 record({name:'Actual RTS result reaches the native Heroes battle summary',result:await hero.evaluate(()=>goonkMobileState.battleResult)});
 await cmd(1);await hero.waitForFunction(()=>goonkMobileState.mode==='map',null,{timeout:60000});
 await cmd(55);await hero.waitForFunction(()=>goonkMobileState.mode==='hero');
 const armies=await hero.evaluate(()=>goonkMobileState.armies),army=armies.find(row=>row.slots.some(Boolean));assert(army);
 for(const original of initial.stacks.filter(row=>row.side===0&&row.creature.startsWith('core:'))){
  const expected=submission.result.groups.find(row=>row.id===original.id).survivors;
  const actual=army.slots.filter(Boolean).filter(row=>row.key===original.creature).reduce((sum,row)=>sum+row.count,0);
  assert.equal(actual,expected,original.creature+' exact native casualty application');
 }
 record({name:'Native Heroes army exactly matches the surviving StarCraft cohorts',army});
 await page.screenshot({path:out+'/heroes-survivors.png',fullPage:true});
 await cmd(63);await hero.waitForFunction(()=>goonkMobileState.mode==='map');
 await cmd(7);
 await hero.waitForFunction(()=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-mobile.vsgm1').size>100000;}catch{return false;}},null,{timeout:60000});
 const saveBytes=await hero.evaluate(()=>Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-mobile.vsgm1').size);
 await cmd(71);await hero.waitForFunction(()=>goonkMobileState.mode==='menu');
 await cmd(23);await hero.waitForFunction(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.some(row=>row.file?.toLowerCase().includes('goonk-mobile')));
 const index=await hero.evaluate(()=>goonkMobileState.maps.find(row=>row.file?.toLowerCase().includes('goonk-mobile')).index);
 await cmd(27,index);await hero.waitForFunction(index=>goonkMobileState.selectedIndex===index,index);
 await cmd(22);await hero.waitForFunction(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn,null,{timeout:60000});
 await cmd(55);await hero.waitForFunction(()=>goonkMobileState.mode==='hero');
 const restored=await hero.evaluate(()=>goonkMobileState.armies.find(row=>row.slots.some(Boolean)));
 assert.deepEqual(restored.slots.map(row=>row&&[row.key,row.count]),army.slots.map(row=>row&&[row.key,row.count]));
 record({name:'Native save and reload preserve exactly the post-RTS Heroes army',saveBytes,restored:restored.slots.map(row=>row&&[row.key,row.count])});
 // A second fresh adventure exercises the product's cancellation path.
 await page.goto('http://127.0.0.1:8779/index.html');await page.locator('#trial').click();
 await page.waitForFunction(()=>[...document.querySelectorAll('iframe')].some(frame=>frame.title==='Heroes — combats StarCraft'));
 hero=page.frames().find(frame=>frame.url().includes('/game.html'));
 await hero.waitForFunction(()=>window.goonkMobileState?.mode==='map'&&goonkMobileState.turn&&goonkMobileState.crossoverEnabled,null,{timeout:180000});
 await cmd(6);await hero.waitForTimeout(200);await hero.evaluate(()=>{const v=goonkMobileState.mapOverview.view;Module._vcmiMobilePointer(v.x+v.w/2+64,v.y+v.h/2,1);});
 await hero.waitForFunction(()=>goonkMobileState.hasPath);await cmd(2);await hero.locator('#crossover-arena').waitFor({timeout:60000});
 await hero.locator('#crossover-cancel').click();
 await hero.waitForFunction(()=>goonkMobileState.mode==='battle'&&!goonkMobileState.crossover&&goonkMobileState.canAutoCombat,null,{timeout:60000});
 await cmd(44,1);await hero.waitForFunction(()=>goonkMobileState.dialogKind==='battle-result',null,{timeout:120000});
 assert.equal(await hero.evaluate(()=>window.testCrossoverSubmission),undefined);
 record('Cancellation resumes a real native Heroes fight through completion without submitting any RTS casualties');
 report.passed=true;save();
}catch(e){report.passed=false;report.error=String(e);report.heroes=await hero?.evaluate(()=>goonkMobileState).catch(()=>null);save();await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{await browser.close();}
console.log(JSON.stringify(report,null,2));
