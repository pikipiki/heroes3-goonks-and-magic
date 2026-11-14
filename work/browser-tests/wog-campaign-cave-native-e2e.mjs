/** Private original-Cave validation. Optional, recorded hero relocation changes only its three coordinates. */
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {silenceTestAudio} from './silent-audio.mjs';
const out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign-cave-native';fs.mkdirSync(out,{recursive:true});
const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8864';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true});
await silenceTestAudio(page);
const errors=[];let messages=0;
page.on('pageerror',e=>{errors.push(e.message);fs.appendFileSync(path.join(out,'page-errors.log'),e.stack+'\n');});
page.on('worker',worker=>worker.evaluate(()=>self.addEventListener('error',event=>console.error('WASM_STACK',event.error?.stack||event.message))).catch(()=>{}));
page.on('console',m=>{if(messages++<6000)fs.appendFileSync(path.join(out,'console.log'),m.type()+': '+m.text().slice(0,2500)+'\n');});
let map=fs.readFileSync('mod/wake-of-gods/Mods/maps/content/maps/Cave of Gerfrex.h3m');
const heroStart=process.env.CAVE_HERO_AT?.split(',').map(Number);
if(heroStart){
 assert.equal(heroStart.length,3);assert(heroStart.every(n=>Number.isInteger(n)&&n>=0&&n<36));
 assert.equal(crypto.createHash('sha256').update(map).digest('hex'),'3d7dbf2835db47991ee9dad4f7cdef3dde93f98086670594bf21668d2c033c50');
 const raw=zlib.gunzipSync(map),marker=Buffer.from([11,26,0,15,1,0,0,0,0,0,0,0,94,42,153,225,1,106,1,7,0,0,0]);
 const at=raw.indexOf(marker);assert.equal(at,62486);assert.equal(raw.indexOf(marker,at+1),-1);
 raw[at]=heroStart[0]+1;raw[at+1]=heroStart[1];raw[at+2]=heroStart[2];map=zlib.gzipSync(raw);
}
const cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]);
const state=()=>page.evaluate(()=>goonkMobileState);
const wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
async function saveAs(name,token){
 const prior=await page.evaluate(()=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').mtime.getTime()}catch{return 0}});
 await cmd(34,token);
 await wait(prior=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').mtime.getTime()>prior}catch{return false}},prior);
 const bytes=Buffer.from(await page.evaluate(()=>Array.from(Module.FS.readFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1'))));
 assert.equal(bytes.readInt32LE(4),903);fs.writeFileSync(path.join(out,name+'.vsgm1'),bytes);return bytes;
}
async function finishLever(question){
 assert.equal(question.dialogKind,'source-campaign');assert(question.dialogPresentation.queryId>=0);assert(question.autosaveAllowed);
 await saveAs('cave-pending-lever',172);
 const answer=process.env.CAVE_ANSWER==='no'?0:1;await cmd(answer);await page.waitForTimeout(300);
 const story=[];
 for(let n=0;n<8;n++){
  await wait(()=>goonkMobileState.mode==='dialog'||(goonkMobileState.mode==='map'&&!goonkMobileState.campaignPending));
  const s=await state();if(s.mode==='map')break;story.push(s.dialogPresentation);await cmd(1);await page.waitForTimeout(300);
 }
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&!goonkMobileState.campaignPending);
 assert(story.some(d=>(d.lines||[]).some(line=>answer?/loud grinding sound/.test(line):/afraid to pull/.test(line))), 'Native continuation shows the selected branch');
 await saveAs('cave-after-lever',173);
 const days=[];
 if(process.env.CAVE_CHECK_DAYS==='1'){
  const startDay=(await state()).day;
  for(let day=startDay;day<=startDay+2;day++){
   if(day>startDay){
    await cmd(3);
    for(let step=0;step<1200;step++){
     const next=await state();
     if(next.mode==='dialog'){story.push(next.dialogPresentation);await cmd(1);}
     else if(next.mode==='map'&&next.turn&&next.day>=day)break;
     await page.waitForTimeout(100);
    }
    await wait(day=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.day===day,day);
   }
   await cmd(5,0);await wait(()=>goonkMobileState.mode==='town');
   const town=await state();fs.writeFileSync(path.join(out,'town-day-'+day+'.json'),JSON.stringify(town,null,2));
   days.push({day,behemoths:(town.recruits||[]).find(c=>c.key==='core:behemoth')?.count??null});
   await cmd(0);await wait(()=>goonkMobileState.mode==='map');
  }
  assert.equal(days[0].behemoths,null,'No Behemoth Lair before the lever event');
  if(answer){assert(days[1].behemoths!==null,'Lair really built on next native turn');assert.equal(days[2].behemoths-days[1].behemoths,12,'Twelve additional Behemoths two turns later');}
  else assert(days.every(d=>d.behemoths===null),'Declining the lever does not create the lair');
 }
 return{question:question.dialogPresentation,answer,story,days};
}

await page.addInitScript(bytes=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');
 const priorWindow=Object.getOwnPropertyDescriptor(window,'Module');let current;
 Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{
  priorWindow?.set?.call(window,m);current=m;
  const prior=Object.getOwnPropertyDescriptor(m,'callMain');let main;
  Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;prior?.set?.call(m,f);},get:()=>function(...args){
   const invoke=prior?.get?prior.get.call(m):main,root='/home/web_user/.local/share/vcmi/';
   const file=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/registry.json';
   const registry=JSON.parse(m.FS.readFile(file,{encoding:'utf8'}));
   const cave=registry.programs.find(p=>p.id==='cave-gerfrex');if(!cave||cave.enabled)throw Error('Expected dormant Cave registry');
   cave.enabled=true;m.FS.writeFile(file,JSON.stringify(registry));
   m.FS.writeFile(root+'Maps/000-Cave-reference.h3m',new Uint8Array(bytes));
   return invoke.apply(m,args);
  }});
 }});
},[...map]);
try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();
 if(process.env.EXPECTED_ENGINE_SHA)assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 await page.goto(origin+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);
 await page.waitForTimeout(500);
 if(process.env.CAVE_LOAD_SAVE){
  const bytes=fs.readFileSync(process.env.CAVE_LOAD_SAVE);
  await page.evaluate(b=>{Module.FS.mkdirTree('/home/web_user/.local/share/vcmi/Saves');Module.FS.writeFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',Uint8Array.from(b));},[...bytes]);
  await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);
  const entry=(await state()).maps.find(e=>/Goonk-auto/i.test(e.name+' '+e.file));assert(entry);await cmd(27,entry.index);await cmd(22);
  await wait(()=>goonkMobileState.mode==='dialog',null,180000);const resumed=await state();
  fs.writeFileSync(path.join(out,'resumed-query.json'),JSON.stringify(resumed,null,2));
  assert.match(JSON.stringify(resumed.dialogPresentation),/strange lever/i);
  const lever=await finishLever(resumed);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,scope:'Real native pending-query save/reload and selected Cave lever continuation',engine,cases:{lever},errors},null,2));
 }else{
 await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);
 const maps=(await state()).maps;fs.writeFileSync(path.join(out,'maps.json'),JSON.stringify(maps,null,2));
 const chosen=maps.find(m=>/Cave of Gerfrex/i.test(m.name));assert(chosen,'Original Cave is discoverable');
 await page.locator('#mobile-map-select').selectOption(String(chosen.index),{force:true});await wait(()=>/Cave of Gerfrex/i.test(goonkMobileState.selectedMap));
 await page.locator('[data-ui=begin]').tap();
 const dialogs=[];
 for(let n=0;n<10;n++){
  await wait(()=>['map','dialog'].includes(goonkMobileState.mode),null,180000);
  const s=await state();if(s.mode==='map'&&s.turn)break;
  if(s.mode==='dialog'){dialogs.push(s.dialogPresentation);await cmd(1);}
  await page.waitForTimeout(150);
 }
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 await cmd(6);await page.waitForTimeout(300);
 const first=await state();fs.writeFileSync(path.join(out,'first-state.json'),JSON.stringify(first,null,2));
 await page.screenshot({path:path.join(out,'first-map.png')});
 await cmd(34,170);await wait(()=>Module.FS.analyzePath('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').exists);
 const save=Buffer.from(await page.evaluate(()=>Array.from(Module.FS.readFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1'))));
 fs.writeFileSync(path.join(out,'cave-start.vsgm1'),save);
 assert.equal(save.subarray(0,4).toString(),'VCMI');assert.equal(save.readInt32LE(4),903);
 assert(save.includes(Buffer.from('source-campaign-state-v1')),'Real game save contains native campaign state');
 assert(save.includes(Buffer.from('cave-gerfrex')),'Save is bound to the original Cave program');
 const cases={};
 if(process.env.CAVE_CASE){await cmd(29,2);await cmd(29,1);await page.waitForTimeout(300);}
  // Native reveal/movement controls; no quest flags/rewards are changed.
  async function goTo(x,y,expected){
   // A silent local event can stop movement before the target. Re-select the
   // destination after that real visit rather than assuming every stop is a dialog.
   for(let attempt=0;attempt<24;attempt++){
    await wait(()=>goonkMobileState.mode==='dialog'||(goonkMobileState.mode==='map'&&!goonkMobileState.campaignPending));
    const prior=await state();
    if(prior.mode==='dialog'){
     if(!expected||expected.test(JSON.stringify(prior.dialogPresentation)))return;
     await cmd(1);await page.waitForTimeout(300);continue;
    }
    const mini=(await state()).mapOverview;
    await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,5),{x:Math.round(mini.rect.x+x*mini.rect.w/36),y:Math.round(mini.rect.y+y*mini.rect.h/36)});
    await page.waitForTimeout(250);const centered=(await state()).mapOverview;
    await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(centered.view.x+centered.view.w/2),y:Math.round(centered.view.y+centered.view.h/2)});
    await wait(()=>goonkMobileState.hasPath||goonkMobileState.mode==='dialog',null,5000);
    if((await state()).mode==='map')await cmd(2);
    await page.waitForTimeout(700);
    await wait(()=>!goonkMobileState.heroMoving,null,15000);
    const stopped=await state();
    fs.appendFileSync(path.join(out,'travel.jsonl'),JSON.stringify({target:[x,y],attempt,state:stopped})+'\n');
    if(stopped.mode==='dialog'){
     if(!expected||expected.test(JSON.stringify(stopped.dialogPresentation)))return;
     await cmd(1);await page.waitForTimeout(300);continue;
    }
    if(stopped.movement===0){await cmd(3);await wait(()=>goonkMobileState.mode==='dialog'||goonkMobileState.turn,null,60000);if((await state()).mode==='dialog')return;}
   }
   throw Error('No dialog reached at '+x+','+y);
  }
 if(['lever','maze-lever'].includes(process.env.CAVE_CASE)){
  if(process.env.CAVE_CASE==='maze-lever'){
   await goTo(15,9);const mazeStory=[];
   for(let n=0;n<10;n++){const s=await state();if(s.mode==='map')break;mazeStory.push(s.dialogPresentation);await cmd(1);await page.waitForTimeout(300);}
   await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);cases.maze={story:mazeStory};
   await goTo(15,10);const crownStory=[];
   for(let n=0;n<6;n++){const s=await state();if(s.mode==='map')break;crownStory.push(s.dialogPresentation);await cmd(1);await page.waitForTimeout(300);}
   await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);cases.maze.crown=crownStory;
   fs.writeFileSync(path.join(out,'maze-story.json'),JSON.stringify(cases.maze,null,2));
   fs.writeFileSync(path.join(out,'after-maze.json'),JSON.stringify(await state(),null,2));
  }
  await goTo(16,25,/guard The Lever|ancient prophecy|fulfill|quest/i);
  const guard=await state();fs.writeFileSync(path.join(out,'lever-guard.json'),JSON.stringify(guard,null,2));
  await page.screenshot({path:path.join(out,'lever-guard.png')});
  for(let n=0;n<4;n++){await cmd(1);await page.waitForTimeout(350);if((await state()).mode==='map')break;}
  await wait(()=>goonkMobileState.mode==='map');
  await goTo(17,25);
  const question=await state();fs.writeFileSync(path.join(out,'lever-question.json'),JSON.stringify(question,null,2));
  assert.match(JSON.stringify(question.dialogPresentation),/strange lever/i);
  cases.lever=await finishLever(question);
 }

 if(process.env.CAVE_CASE==='witch'){
  const before=await state(),branch=process.env.CAVE_WITCH_CHOICE||'give';
  assert(['give','kill','spit'].includes(branch));
  await goTo(28,16,/Do you slay her/i);
  const question=await state();assert.equal(question.dialogKind,'source-campaign');
  const story=[question.dialogPresentation];await cmd(branch==='kill'?1:0);await page.waitForTimeout(300);
  for(let n=0;n<12;n++){
   await wait(()=>goonkMobileState.mode==='dialog'||(goonkMobileState.mode==='map'&&!goonkMobileState.campaignPending));
   const s=await state();if(s.mode==='map')break;story.push(s.dialogPresentation);
   await cmd(s.dialogPresentation.cancel?(branch==='give'?1:0):1);await page.waitForTimeout(300);
  }
  await wait(()=>goonkMobileState.mode==='map'&&!goonkMobileState.campaignPending);
  const after=await state(),army=after.armies.find(a=>a.id===after.heroId).slots;
  if(branch==='give'){
   assert.equal(after.resources[6],before.resources[6]-1000,'Real gold payment');
   assert(after.equipment.some(a=>a.name==='Pendant of Second Sight'),'Native pendant reward');
   assert.deepEqual(army.map(a=>[a.key,a.count]),before.armies.find(a=>a.id===before.heroId).slots.map(a=>[a.key,a.count]));
  }else if(branch==='kill')assert(army.every(a=>a.key==='core:troglodyte'),'Real army transformation');
  else assert.equal(army.filter(a=>a.key==='core:troglodyte').length,2,'Exactly two real stacks transformed');
  await saveAs('cave-after-witch',174);cases.witch={branch,story,before,after};
 }
 if(process.env.CAVE_CASE==='tomb'){
  await goTo(22,20,/protector of the dead/i);
  const question=await state();assert.equal(question.dialogKind,'source-campaign');await cmd(0);await page.waitForTimeout(300);
  const story=[];
  for(let n=0;n<8;n++){
   await wait(()=>goonkMobileState.mode==='dialog'||(goonkMobileState.mode==='map'&&!goonkMobileState.campaignPending));
   const s=await state();if(s.mode==='map')break;story.push(s.dialogPresentation);await cmd(1);await page.waitForTimeout(300);
  }
  assert.equal((await state()).heroMana,0,'Refusing the protector really removes mana');
  await goTo(23,21);
  let battle;
  for(let step=0;step<200;step++){
   const s=await state();if(s.mode==='battle'&&s.round>0&&s.battleUnits?.length){battle=s;break;}
   if(s.mode==='dialog')await cmd(1);
   else if(s.mode==='battle'&&s.canEndTactics)await cmd(35);
   await page.waitForTimeout(100);
  }
  assert(battle,'Real scripted guard battle reaches a positive round');
  const enemies=battle.battleUnits.filter(u=>u.enemy);
  assert.equal(enemies.filter(u=>u.key==='core:zealot').reduce((sum,u)=>sum+u.count,0),48);
  assert.equal(enemies.filter(u=>u.key==='core:archangel').reduce((sum,u)=>sum+u.count,0),1);
  fs.writeFileSync(path.join(out,'native-guard-battle.json'),JSON.stringify(battle,null,2));
  await page.screenshot({path:path.join(out,'native-guard-battle.png')});cases.tomb={question:question.dialogPresentation,story,positiveBattleRound:battle.round};
 }

 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,scope:cases.witch?'Controlled hero relocation, real witch choice, native army/resource/artifact effects; full victory not validated':cases.tomb?'Controlled hero relocation, actual tomb dialogue, mana removal and scripted guard battle; battle outcome not validated':cases.lever?'Controlled hero relocation, original maze goal, Crown pickup, native quest guard and lever continuation; full map victory not validated':'Original Cave startup and native state save only',engine,heroStartOverride:heroStart||null,dialogs,cases,errors},null,2));
 }
}catch(error){
 fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));
 await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});
 const logs=await page.evaluate(()=>{try{const root='/home/web_user/.cache/vcmi/';return Object.fromEntries(Module.FS.readdir(root).filter(n=>/log\.txt$/i.test(n)).map(n=>[n,Module.FS.readFile(root+n,{encoding:'utf8'}).slice(-160000)]));}catch{return{};}}).catch(()=>({}));
 fs.writeFileSync(path.join(out,'failure-native-logs.json'),JSON.stringify(logs,null,2));console.error(error);process.exitCode=1;
}finally{await browser.close();}
