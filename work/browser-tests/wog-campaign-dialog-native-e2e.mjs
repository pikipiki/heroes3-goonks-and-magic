/** Private instruction proof at Cave's maze goal. Dialog modes isolate IF;
 * battle mode runs an actual HE:T with controlled context and hero army.
 * No full original quest, scenario or campaign victory is claimed. */
import {chromium} from 'playwright-core';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import zlib from 'node:zlib';import assert from 'node:assert/strict';
import {compileNativeCampaign} from '../../scripts/era-bridge/campaigns/native-compiler.mjs';
import {silenceTestAudio} from './silent-audio.mjs';
const mode=process.env.CAMPAIGN_DIALOG_CASE||'input',origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8869',out=process.env.REVIEW_OUTPUT||'/tmp/goonk-campaign-dialog-native';fs.mkdirSync(out,{recursive:true});
const n=value=>({kind:'number',access:'read',number:value}),v=(space,index)=>({kind:'variable',access:'read',space,index:n(index)}),literal=text=>({kind:'string',access:'read',text});
const set=(target,value)=>({receiver:'VR',selectors:[target],conditions:[],operations:[{code:'S',args:[typeof value==='number'?n(value):literal(value)]}]}),message=text=>({receiver:'IF',selectors:[],conditions:[],operations:[{code:'M',args:[literal(text)]}]});
const campaign=compileNativeCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc4.vcmp'),scenario=campaign.scenarios.find(s=>s.member==='wog_camp2a.vmap');
const commands=[...scenario.program.initializers,...scenario.program.blocks.flatMap(b=>b.commands)];let initializers=[],fixtureCommands=[],expected,sourceArchiveSha256=campaign.sourceArchiveSha256;
if(mode==='input'||mode==='reward'){
 const riddle=scenario.program.blocks.find(b=>b.receiver==='FU'&&b.selectors[0]?.number===31);assert(riddle);
 initializers=scenario.program.initializers.filter(c=>c.receiver==='VR'&&c.selectors[0]?.space==='z'&&[311,312,314].includes(c.selectors[0].index.number));assert.equal(initializers.length,3);
 fixtureCommands=mode==='reward'?[...riddle.commands,message('Native quest reward completed: %V310/%V312')]:riddle.commands.filter(c=>c.receiver!=='HE');
 expected=process.env.CAMPAIGN_ANSWER==='wrong'?/casted the spell wrong/i:/casted the spell right/i;
}else if(mode==='checklist'||mode==='radio'){
 const source=campaign.scenarios.find(s=>s.member===(mode==='checklist'?'wog_camp1a.vmap':'wog_camp3atemp.vmap'));
 const all=[...source.program.initializers,...source.program.blocks.flatMap(b=>b.commands)];
 const command=all.find(c=>c.receiver==='IF'&&c.operations.some(o=>o.code==='G'&&o.args[0]?.number===(mode==='checklist'?0:1)&& (mode==='checklist'||o.args[3]?.number===411)));assert(command);
 const operation=command.operations.find(o=>o.code==='G'),target=operation.args[1].number,indices=operation.args.slice(3).map(a=>a.number);
 for(const index of indices){const original=all.find(c=>c.receiver==='VR'&&c.selectors[0]?.space==='z'&&c.selectors[0].index.number===index&&c.operations[0]?.code==='S'&&c.operations[0].args[0]?.kind==='string');assert(original,'Original choice label '+index);initializers.push({...original,conditions:[]});}
 fixtureCommands=[{...command,conditions:[]},message('Native dialog result: %V'+target)];expected=mode==='checklist'?/Native dialog result: 13/:/Native dialog result: 4/;
}else if(mode==='artwork'){
 const archive=compileNativeCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp');sourceArchiveSha256=archive.sourceArchiveSha256;
 const source=archive.scenarios.find(s=>s.member==='z_-~-_01e.vmap'),all=[...source.program.initializers,...source.program.blocks.flatMap(b=>b.commands)];
 initializers=all.filter(c=>c.receiver==='VR'&&c.selectors[0]?.space==='z'&&((c.selectors[0].index.number>=100&&c.selectors[0].index.number<=110)||c.selectors[0].index.number===199)&&c.operations[0]?.code==='S'&&c.operations[0]?.args[0]?.kind==='string').map(c=>({...c,conditions:[]}));
 const definition=all.find(c=>c.receiver==='IF'&&c.operations.some(o=>o.code==='D'&&o.args[0]?.number===1));assert(definition);
 fixtureCommands=[definition,{receiver:'IF',selectors:[],conditions:[],operations:[{code:'E',args:[n(901),n(1)]}]},message('Native original artwork completed: %V901')];expected=/Native original artwork completed: 1/;
}else if(mode==='pictures'){
 const command=commands.find(c=>c.receiver==='IF'&&c.operations.some(o=>o.code==='Q'&&o.args.at(-2)?.number===7));assert(command);
 fixtureCommands=[set(v('y',1),6),set(v('y',2),7),set(v('y',5),3),set(v('z',161),'First artifact'),set(v('z',162),'Second artifact'),command,message('Native picture answer: %F162')];expected=/Native picture answer: 0/;
}else if(mode==='battle'){
 const archive=compileNativeCampaign('mod/wake-of-gods/Mods/maps/content/maps/zc1.vcmp');sourceArchiveSha256=archive.sourceArchiveSha256;const source=archive.scenarios.find(s=>s.member==='z_-~-_01e.vmap');
 const battle=source.program.blocks.flatMap(b=>b.commands).find(c=>c.receiver==='HE'&&c.selectors[0]?.number===-1&&c.operations.some(o=>o.code==='T'&&o.args[0]?.number===26));assert(battle);
 const army=(slot,type,count)=>({receiver:'HE',selectors:[n(-1)],conditions:[],operations:[{code:'C',args:[n(0),n(slot),n(type),n(count)]}]});
 initializers=[set(v('v',500),2)];fixtureCommands=[message('Begin the native scripted battle.'),army(0,process.env.CAMPAIGN_BATTLE_LOSE?84:83,process.env.CAMPAIGN_BATTLE_LOSE?1:100),...Array.from({length:6},(_,i)=>army(i+1,-1,0)),battle,message('Native scripted battle completed: %F1')];expected=process.env.CAMPAIGN_BATTLE_LOSE?/Native scripted battle completed: 0/:/Native scripted battle completed: 1/;
}else throw Error('Unknown dialog fixture');
const fixture={mode,sourceArchiveSha256,initializers,commands:fixtureCommands,scope:mode==='battle'?'Actual source HE-1:T26/27/0/7/10 and condition v500>1, with private hero army and v500 context. No original quest/campaign victory.':mode==='reward'?'Complete original FU31 riddle instructions, including the real three-rust-dragon reward, at a private Cave event. No original scenario victory.':'Campaign dialog instructions only; native reward/combat actions removed from the riddle; explicit display context for isolated choice forms.'};
fixture.sha256=crypto.createHash('sha256').update(JSON.stringify(fixture)).digest('hex');fs.writeFileSync(path.join(out,'fixture.json'),JSON.stringify(fixture,null,2));
let bytes=fs.readFileSync('mod/wake-of-gods/Mods/maps/content/maps/Cave of Gerfrex.h3m');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'3d7dbf2835db47991ee9dad4f7cdef3dde93f98086670594bf21668d2c033c50');
const raw=zlib.gunzipSync(bytes),marker=Buffer.from([11,26,0,15,1,0,0,0,0,0,0,0,94,42,153,225,1,106,1,7,0,0,0]),at=raw.indexOf(marker);assert.equal(at,62486);raw[at]=16;raw[at+1]=10;bytes=zlib.gzipSync(raw); // Hero's visitable position15/10, directly below the real goal event.
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,bypassCSP:true}),errors=[];await silenceTestAudio(page);page.on('pageerror',e=>errors.push(e.message));page.on('worker',worker=>worker.evaluate(()=>self.addEventListener('error',event=>console.error('WASM_STACK',event.error?.stack||event.message))).catch(()=>{}));page.on('console',m=>fs.appendFileSync(path.join(out,'console.log'),m.type()+': '+m.text().slice(0,2000)+'\n'));
const state=()=>page.evaluate(()=>goonkMobileState),cmd=(...args)=>page.evaluate(args=>Module._vcmiMobileCommand(...args),[...args,...Array(6-args.length).fill(0)]),wait=(fn,arg,timeout=90000)=>page.waitForFunction(fn,arg,{timeout});
await page.addInitScript(({bytes,fixture})=>{
 sessionStorage.setItem('heroes-goonk.storage-failed','true');const priorWindow=Object.getOwnPropertyDescriptor(window,'Module');let current;
 Object.defineProperty(window,'Module',{configurable:true,get:()=>current,set:m=>{priorWindow?.set?.call(window,m);current=m;const old=Object.getOwnPropertyDescriptor(m,'callMain');let main;
 Object.defineProperty(m,'callMain',{configurable:true,set:f=>{main=f;old?.set?.call(m,f);},get:()=>function(...args){
 const invoke=old?.get?old.get.call(m):main,root='/home/web_user/.local/share/vcmi/',folder=root+'Mods/wake-of-gods/Mods/mapSupport/Content/config/era-campaigns/';
 const registry=JSON.parse(m.FS.readFile(folder+'registry.json',{encoding:'utf8'})),entry=registry.programs.find(p=>p.id==='cave-gerfrex');assertDormant(entry);entry.enabled=true;
 const program=JSON.parse(m.FS.readFile(folder+'cave-gerfrex.json',{encoding:'utf8'}));const goal=program.blocks.find(b=>b.receiver==='LE'&&b.selectors.map(v=>v.number).join('/')==='15/9/0');if(!goal)throw Error('Missing original Cave goal');
 program.initializers.push(...fixture.initializers);goal.commands=fixture.commands;program.sha256=fixture.sha256;entry.programSha256=fixture.sha256;
 m.FS.writeFile(folder+'cave-gerfrex.json',JSON.stringify(program));m.FS.writeFile(folder+'registry.json',JSON.stringify(registry));m.FS.writeFile(root+'Maps/000-Cave-reference.h3m',new Uint8Array(bytes));return invoke.apply(m,args);
 }});
 }});
 function assertDormant(entry){if(!entry||entry.enabled)throw Error('Expected dormant production registry');}
},{bytes:[...bytes],fixture});
async function savePending(){
 const prior=await page.evaluate(()=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').mtime.getTime()}catch{return 0}});
 await cmd(34,177);await wait(prior=>{try{return Module.FS.stat('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1').mtime.getTime()>prior}catch{return false}},prior);
 fs.writeFileSync(path.join(out,'pending-dialog.vsgm1'),Buffer.from(await page.evaluate(()=>Array.from(Module.FS.readFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1')))));
}
async function finishReward(engine){
 await wait(()=>goonkMobileState.mode==='hero-exchange'&&goonkMobileState.heroExchange?.troopsOnly);const before=await state();assert(before.autosaveAllowed&&before.campaignPending);
 const exchange=before.heroExchange.heroes,offered=exchange[0].army.slots[0],received=exchange[1].army.slots[3];assert.equal(offered.key,'core:rustDragon');
 assert.equal(offered.count,process.env.CAMPAIGN_LOAD_SAVE?2:3);
 if(process.env.CAMPAIGN_LOAD_SAVE)assert.equal(received?.count,1);
 else{
  assert.equal(received?.key,'core:hobgoblin');assert.equal(received.count,17);
  await page.locator('[data-exchange-slot="1:3"]').tap();await page.locator('[data-exchange-slot="1:1"]').tap();await page.locator('[data-exchange-confirm]').tap();
  await wait(()=>!goonkMobileState.heroExchange?.heroes[1].army.slots[3]&&goonkMobileState.heroExchange.heroes[1].army.slots[1].count===32);
 }
 await page.locator('[data-exchange-slot="0:0"]').tap();await page.locator('[data-exchange-slot="1:3"]').tap();
 if(process.env.CAMPAIGN_PARTIAL_REWARD)await page.locator('[data-exchange-quantity]').fill('1');
 await page.locator('[data-exchange-confirm]').tap();
 const expected=process.env.CAMPAIGN_PARTIAL_REWARD?1:3;await wait(count=>goonkMobileState.heroExchange?.heroes[1].army.slots[3]?.count===count,expected);await savePending();
 if(process.env.CAMPAIGN_PARTIAL_REWARD){
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,mode,scope:fixture.scope,fixtureSha256:fixture.sha256,engine,partialReward:true,before,after:await state(),errors},null,2));return;
 }
 await page.locator('[data-exchange-close]').tap();await wait(()=>goonkMobileState.mode==='dialog'&&JSON.stringify(goonkMobileState.dialogPresentation).includes('Native quest reward completed: 1/1'));
 const result=await state();assert(result.armies.find(a=>a.id===before.heroId).slots.some(u=>u?.key==='core:rustDragon'&&u.count===3));assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(out,'native-reward-completed.png')});await savePending();
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,mode,scope:fixture.scope,fixtureSha256:fixture.sha256,sourceArchiveSha256,engine,loadedPartialReward:!!process.env.CAMPAIGN_LOAD_SAVE,before,result,errors},null,2));
}
try{
 const engine=await(await page.request.get(origin+'/engine-build.json')).json();if(process.env.EXPECTED_ENGINE_SHA)assert.equal(engine.sha256,process.env.EXPECTED_ENGINE_SHA);
 await page.goto(origin+'/game.html?mobile=1');await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done',null,240000);await page.waitForTimeout(400);
 if(process.env.CAMPAIGN_LOAD_SAVE){
  await page.evaluate(b=>{Module.FS.mkdirTree('/home/web_user/.local/share/vcmi/Saves');Module.FS.writeFile('/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',new Uint8Array(b));},[...fs.readFileSync(process.env.CAMPAIGN_LOAD_SAVE)]);
  await cmd(23);await wait(()=>goonkMobileState.mode==='load'&&goonkMobileState.lobbyReady&&goonkMobileState.maps?.length);const entry=(await state()).maps.find(e=>/Goonk-auto/i.test(e.name+' '+e.file));assert(entry);await cmd(27,entry.index);await cmd(22);
 }else{
  await cmd(20,1);await wait(()=>goonkMobileState.mode==='lobby'&&goonkMobileState.lobbyReady);const entry=(await state()).maps.find(m=>/Cave of Gerfrex/i.test(m.name));assert(entry);await page.locator('#mobile-map-select').selectOption(String(entry.index),{force:true});await wait(()=>/Cave of Gerfrex/i.test(goonkMobileState.selectedMap));await cmd(22);
  for(let n=0;n<8;n++){await wait(()=>['map','dialog'].includes(goonkMobileState.mode),null,180000);if((await state()).mode==='map')break;await cmd(1);await page.waitForTimeout(200);}
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);const mini=(await state()).mapOverview;
  await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,5),{x:Math.round(mini.rect.x+15*mini.rect.w/36),y:Math.round(mini.rect.y+9*mini.rect.h/36)});await page.waitForTimeout(200);const view=(await state()).mapOverview.view;
  await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x:Math.round(view.x+view.w/2),y:Math.round(view.y+view.h/2)});await wait(()=>goonkMobileState.hasPath);await cmd(2);
 }
 if(mode==='reward'&&process.env.CAMPAIGN_LOAD_SAVE){await finishReward(engine);}
 else if(process.env.CAMPAIGN_AFTER_BATTLE_SAVE){
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&!goonkMobileState.campaignPending);const before=await state();await cmd(3);
  for(let step=0;step<900;step++){const s=await state();if(s.mode==='dialog')await cmd(1);else if(s.mode==='map'&&s.turn&&s.day>before.day)break;await page.waitForTimeout(100);}
  const after=await state();assert.equal(after.mode,'map');assert(after.turn&&after.day>before.day&&!after.campaignPending);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,mode,scope:'Native post-battle save reload and real next turn; completed source battle is not replayed.',fixtureSha256:fixture.sha256,engine,before,after,errors},null,2));
 }else if(mode==='battle'){
  let originalEvents;
  const eventNames=()=>new Set(fs.readFileSync(path.join(out,'pending-dialog.vsgm1')).toString('latin1').match(/\bevent_\d+/g)||[]);
  for(let n=0;n<8;n++){await wait(()=>['battle','dialog'].includes(goonkMobileState.mode),null,60000);if((await state()).mode==='battle')break;if(!originalEvents){await savePending();originalEvents=eventNames();}await cmd(1);await page.waitForTimeout(200);}
  await wait(()=>goonkMobileState.mode==='battle',null,60000);const battle=await state();assert(battle.campaignPending);assert(!battle.autosaveAllowed);assert.equal(await page.locator('.dialog-presentation').isVisible(),false,'Battle replaces the previous source message');
  assert(battle.battleUnits.some(u=>u.enemy&&u.key==='core:crusader'&&u.count===10),'Original source7 defenders are present');await page.screenshot({path:path.join(out,'native-scripted-battle.png')});
  await cmd(15);if(battle.canEndTactics)await cmd(35);
  let result;const answeredWindows=new Set();
  for(let step=0;step<1500;step++){
   const s=await state();if(step%20===0)fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify(s,null,2));if(s.mode==='dialog'&&expected.test(JSON.stringify(s.dialogPresentation))){result=s;break;}
   if(s.mode==='dialog'){
    const id=s.dialogPresentation?.queryId,token=id>=0?'query:'+id:'window:'+s.windowToken+':'+JSON.stringify(s.dialogPresentation?.lines);
    if(answeredWindows.has(token)){await page.waitForTimeout(100);continue;}answeredWindows.add(token);
    const choice=s.dialogPresentation?.choices?.find(c=>c.selectable);
    if(choice?.rect)await page.evaluate(r=>Module._vcmiMobilePointer(Math.round(r.x+r.w/2),Math.round(r.y+r.h/2),1),choice.rect);
    await cmd(1);
   }else if(s.mode==='battle'){if(s.canEndTactics)await cmd(35);else if(!s.autoCombat&&s.canAutoCombat)await cmd(44,1);}
   await page.waitForTimeout(100);
  }
  assert(result,'VM resumes with the native battle outcome');assert.deepEqual(errors,[]);await page.screenshot({path:path.join(out,'native-battle-continuation.png')});
  await savePending();await cmd(1);
  for(let step=0;step<30;step++){const s=await state();if(s.mode==='map'&&!s.campaignPending)break;if(s.mode==='dialog')await cmd(1);await page.waitForTimeout(100);}
  await wait(()=>goonkMobileState.mode==='map'&&!goonkMobileState.campaignPending);const after=await state();await savePending();
  const leftoverEvents=[...eventNames()].filter(name=>!originalEvents.has(name));assert.deepEqual(leftoverEvents,[],'Temporary battle carrier is absent from the real post-battle save');
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,mode,scope:fixture.scope,fixtureSha256:fixture.sha256,sourceArchiveSha256,engine,battle,result,after,temporaryEventAbsentFromSave:true,errors},null,2));
 }else{
 for(let n=0;n<8;n++){await wait(()=>goonkMobileState.mode==='dialog',null,60000);const s=await state();if(s.dialogPresentation?.scriptDialog)break;await cmd(1);await page.waitForTimeout(200);}
 await wait(()=>!!goonkMobileState.dialogPresentation?.scriptDialog);const pending=await state();assert.equal(pending.dialogKind,'source-campaign');assert(pending.autosaveAllowed);await savePending();
 if(process.env.CAMPAIGN_EXPECT_SELECTION!==undefined){
  const actual=await page.locator('[data-campaign-choice]:checked').evaluateAll(inputs=>inputs.reduce((mask,input)=>mask|Number(input.value),0));assert.equal(actual,Number(process.env.CAMPAIGN_EXPECT_SELECTION),'Choice draft restored by native save');
 }
 if(mode==='input'||mode==='reward'){
  if(process.env.CAMPAIGN_EXPECT_DRAFT)assert.equal(await page.locator('[data-campaign-input]').inputValue(),process.env.CAMPAIGN_EXPECT_DRAFT,'Typed draft restored by native save');
  await page.evaluate(()=>window.savedCampaignInput=document.querySelector('[data-campaign-input]'));
  await page.locator('[data-campaign-input]').fill(process.env.CAMPAIGN_TEXT||(process.env.CAMPAIGN_ANSWER==='wrong'?'Not the spell':'rUsT dRaGoNs NoT cRuSt DrAgOnS cOmE aNd JoIn'));
 }
 else if(mode==='artwork'){
  assert.deepEqual(pending.dialogPresentation.scriptDialog.pictures.map(p=>p.mediaKey),['cmp.res/11_901.bmp','cmp.res/11_902.bmp','cmp.res/11_903.bmp','cmp.res/11_904.bmp']);
  assert.equal(await page.locator('.campaign-media-thumbnail img').count(),4);
  await page.locator('.campaign-media-thumbnail').first().tap();await page.locator('.campaign-media-viewer img').evaluate(img=>img.decode());await page.locator('.campaign-media-viewer header button').tap();
  await page.locator('[data-campaign-input]').fill('Native hero');await page.locator('[data-campaign-choice="1"]').check();
 }
 else if(mode==='checklist')for(const value of [1,4,8])await page.locator(`[data-campaign-choice="${value}"]`).check();
 else if(mode==='radio')await page.locator('[data-campaign-choice="4"]').check();
 else await page.locator('[data-campaign-choice="0"]').check();
 await page.waitForTimeout(500);
 if(mode==='input'||mode==='reward')assert(await page.evaluate(()=>savedCampaignInput===document.querySelector('[data-campaign-input]')&&document.activeElement===savedCampaignInput),'Native draft sync keeps input and focus');
 await savePending();
 if(mode==='input'&&process.env.CAMPAIGN_ANSWER!=='wrong')assert(fs.readFileSync(path.join(out,'pending-dialog.vsgm1')).includes(Buffer.from(process.env.CAMPAIGN_TEXT||'rUsT dRaGoNs NoT cRuSt DrAgOnS cOmE aNd JoIn')),'Typed draft reaches the real native save');
 await page.locator('[data-dialog-confirm]').tap();await wait(pattern=>goonkMobileState.mode==='dialog'&&new RegExp(pattern,'i').test(JSON.stringify(goonkMobileState.dialogPresentation)),expected.source);
 if(mode==='reward'){
  await cmd(1);await finishReward(engine);
 }else{
 const result=await state();assert.deepEqual(errors,[]);await page.screenshot({path:path.join(out,'native-dialog-result.png')});
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,mode,fixtureSha256:fixture.sha256,sourceArchiveSha256:fixture.sourceArchiveSha256,scope:fixture.scope,controls:{originalMapHeroPosition:[15,10,0],privateProgramReplacement:'Maze goal commands and required literal definitions only',nativeRewardsAndBattlesValidated:false},loadedPendingQuery:!!process.env.CAMPAIGN_LOAD_SAVE,engine,pending,result,errors},null,2));
 }
 }
}catch(error){console.error(error);fs.writeFileSync(path.join(out,'failure-state.json'),JSON.stringify(await state().catch(()=>null),null,2));await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});process.exitCode=1;}finally{await browser.close();}
