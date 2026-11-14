/** Loads real older saves; writes only the browser's Saves directory. No registry or asset overrides. */
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
const origin=process.env.GOONK_TEST_ORIGIN,out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign-save-compatibility';
const references=JSON.parse(process.env.LEGACY_REPORTS||'[]');assert(origin&&references.length);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[],errors=[];let page;
const cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
const state=()=>page.evaluate(()=>goonkMobileState),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
function snapshot(s){return{day:s.day,currentPlayer:s.currentPlayer,players:s.players.map(p=>({color:p.color,human:p.human,name:p.name})),resources:s.resources,heroes:s.heroes.map(h=>({id:h.id,name:h.name,movement:h.movement,mana:h.mana,manaLimit:h.manaLimit})),towns:s.towns.map(t=>({id:t.id,name:t.name})),armies:s.armies.map(a=>({id:a.id,slots:a.slots.map(u=>u?{key:u.key,count:u.count,xp:u.experience,rank:u.experienceRank}:null)}))};}
try{
 for(const reference of references){
  const document=JSON.parse(fs.readFileSync(reference)),prior=document.report||document;assert(prior.maps?.length&&prior.maps.every(m=>m.passed&&m.saveReloadValidated));
  for(const old of prior.maps){
   const file=path.join(path.dirname(reference),old.name+'-day1.vsgm1'),bytes=fs.readFileSync(file),version=bytes.readInt32LE(4);assert([901,902].includes(version));
   page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});await silenceTestAudio(page);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
   await page.evaluate(b=>{Module.FS.mkdirTree('/home/web_user/.local/share/vcmi/Saves');Module.FS.writeFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',new Uint8Array(b));},[...bytes]);
   await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);
   const entry=(await state()).maps.find(e=>/Goonk-auto/i.test(e.name+' '+e.file));assert(entry);await cmd(27,entry.index);await cmd(22);
   for(let n=0;n<8;n++){await wait(()=>['map','dialog'].includes(goonkMobileState.mode));if((await state()).mode==='map')break;await cmd(1);await page.waitForTimeout(150);}
   await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
   const loaded=await state();assert.deepEqual(snapshot(loaded),old.before,'Older native save retains exact state');assert(!loaded.campaignPending,'Older maps do not acquire source campaign state');
   await cmd(34,175);await page.waitForTimeout(800);
   const upgraded=Buffer.from(await page.evaluate(()=>Array.from(Module.FS.readFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1'))));
   assert.equal(upgraded.readInt32LE(4),903);assert(!upgraded.includes(Buffer.from('source-campaign-state-v1')),'Dormant registry does not bind a Goonk map');
   await cmd(3);
   for(let n=0;n<1800;n++){const s=await state();if(s.mode==='dialog')await cmd(1);else if(s.mode==='map'&&s.turn&&(old.nativeHotseat?s.currentPlayer!==loaded.currentPlayer:s.day>loaded.day))break;await page.waitForTimeout(100);}
   const after=await state();assert.equal(after.mode,'map');assert(after.turn);assert(old.nativeHotseat?after.currentPlayer!==loaded.currentPlayer:after.day>loaded.day);assert.deepEqual(after.players,loaded.players);
   results.push({passed:true,map:old.name,oldVersion:version,newVersion:903,exactStatePreserved:true,realNextTurn:true,campaignStateAbsent:true});
   await page.close();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:false,inProgress:true,results,errors},null,2));
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,results,errors},null,2));console.log('PASS older901/902 native saves and actual resumed turns');
}catch(error){console.error(error);if(page)fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));process.exitCode=1;}finally{await browser.close();}
