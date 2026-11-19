import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runCommanderWords({boot,state,command,wait,page,report,output,save}){
 // Hero IDs pinned to the bundled ERA constants, not inferred from names.
 const heroes=[['christian',6],['ivor',21],['solmyr',45],['marius',50],['sandro',74],['mutare',151],['cragHack',102],['tazar',115],['luna',136]];
 const type=Number(process.env.COMMANDER_FACTION??(process.env.COMMANDER_NON_PALADIN==='1'?1:0));assert(heroes[type]);
 const checkpointLevel=Number(process.env.COMMANDER_CHOICE_CHECKPOINT_LEVEL||0),previousWordSave=process.env.COMMANDER_PREVIOUS_WORD_SAVE;
 const expectedSaveVersion=Number(process.env.GOONK_EXPECTED_SAVE_VERSION||941);
 const heroNegative=process.env.COMMANDER_HERO_NEGATIVE==='1';
 const reference=process.env.COMMANDER_REFERENCE==='1',ai=process.env.COMMANDER_AI==='1';
 const cap=process.env.COMMANDER_CAP==='1',reserve=process.env.COMMANDER_RESERVE==='1'||cap;
 const nonPaladin=type!==0,desktop=process.env.GROWTH_DESKTOP==='1',negative=process.env.COMMANDER_NEGATIVE==='1',wrap=process.env.COMMANDER_WRAP==='1';
 const zeroRecalculation=process.env.COMMANDER_ZERO_RECALC==='1',baseline=process.env.COMMANDER_BASELINE==='1',suppressed=process.env.COMMANDER_SUPPRESSED==='1';
 const producer=process.env.COMMANDER_LEGACY_PRODUCER==='1',legacySave=process.env.COMMANDER_LEGACY_SAVE,legacy=producer||!!legacySave;
 const hero=heroes[type][1],raw=cap?2147483647:wrap?-2147483648:negative?-1:zeroRecalculation?5000:0,experience=heroNegative?-1:negative||wrap||zeroRecalculation||cap?0:5000;
 const source=legacy?`ZVSE
!#IF:M^COMMANDER_RAW_LEGACY^;
!#HE${hero}:E5000;
!#CO${hero}:X1/?v902;
!#HE${hero}:E?v903/?v904/1;
!#IF:M^COMMANDER_DONE %V902/%V903/%V904^;`:`ZVSE
${ai?`!#HE${hero}:O1;`:''}
${cap?`!#HE${hero}:E0/1;`:''}
!#HE${hero}:E?v898/?v899/1;
!#CO${hero}:X1/${wrap?2147483647:raw};
${wrap?`!#CO${hero}:X1/d1;`:''}
${reference?`!#CO${hero}:X0/1000;`:''}
!#CO${hero}:T?v900 X1/?v901 X2/?v912 X0/?v913;
!#IF:M^COMMANDER_RAW %V900/%V901 LEVEL %V912 REF %V913${reserve?' BASE %V898':''}^;
${suppressed?`!#HE${hero}:E3200/?v899/1;\n!#CO${hero}:X1/?v905 X1/1000;\n!#HE${hero}:E5000;`:baseline?`!#HE${hero}:E3200;\n!#CO${hero}:X1/1000;\n!#HE${hero}:E5000;`:`!#HE${hero}:E${experience};`}
!#CO${hero}:X1/?v902 X2/?v906 X0/?v907;
!#HE${hero}:E?v903/?v904/1;
!#IF:M^COMMANDER_DONE %V902/%V903/%V904 CLEVEL %V906 REF %V907${suppressed?' AFTER %V905':''}^;`;
 const program=compileErm(Buffer.from(source),{source:'Private original CO:T/X1 signed XP and HE:E baseline witness'});program.originalMessages=['ZVSE private native companion town continuation'];
 fs.writeFileSync(path.join(output,'commander-program.json'),JSON.stringify(program,null,2));
 const options={enabled:false,reserveHero:ai,scriptTown:true,scriptProgram:program,commanderWordFixture:{hero:reserve?'core:christian':'core:'+heroes[type][0]},levelArtifactChoice:0,viewport:desktop?{width:1280,height:800}:{width:390,height:844},expectedDialog:'source-campaign'};
 const inputSave=legacySave||previousWordSave;
 if(previousWordSave)assert.equal(fs.readFileSync(previousWordSave).readInt32LE(4),941);
 await boot({...options,...(inputSave?{save:[...fs.readFileSync(inputSave)]}:{})});
 const text=async()=>( (await state()).dialogPresentation?.lines||[]).join(' ').replace(/\s+/g,' ').trim();
 const firstText=await text(),initialBaseline=reserve?Number(firstText.match(/ BASE (\d+)$/)?.[1]):0;
 if(reserve)assert(Number.isFinite(initialBaseline));
 const checkpointText=legacy?'COMMANDER_RAW_LEGACY':`COMMANDER_RAW ${type}/${raw} LEVEL 1 REF ${reference?1000:initialBaseline}${reserve?' BASE '+initialBaseline:''}`;
 assert.equal(await text(),checkpointText);
 const beforeLog=await page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
 assert(!/Sending a pack of type \d+CommanderLevelUp\b/.test(beforeLog),'Raw CO:X1 does not level the commander');
 fs.writeFileSync(path.join(output,'raw-command-packets.log'),beforeLog);
 const bytes=await save();fs.writeFileSync(path.join(output,'raw-command.vsgm1'),bytes);
 if(producer){assert.equal(bytes.readInt32LE(4),940);report.scenarios.push({legacyProducer:true,saveVersion:940});await page().close();return;}
 assert.equal(bytes.readInt32LE(4),expectedSaveVersion);
 await page().close();await boot({...options,save:[...bytes]});assert.equal(await text(),checkpointText);
 const initialQuery=(await state()).dialogPresentation?.queryId;
 await page().locator('[data-dialog-confirm]')[desktop?'click':'tap']();
 await wait(id=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==id,initialQuery);
 const order=[],commanderLevels=[],beforeReloadLogs=[];let done=false,choiceReloads=0;
 const nativeLog=()=>page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
 for(let tick=0;tick<600;++tick){
  let current=await state();
  if(checkpointLevel && !choiceReloads && current.dialogKind==='commander-level-up' && current.dialogPresentation.commanderTree.level===checkpointLevel){
   const snapshot=s=>({level:s.dialogPresentation.commanderTree.level,skills:s.dialogPresentation.commanderTree.skills.map(s=>({id:s.id,rank:s.rank})),offers:s.dialogPresentation.choices.filter(c=>c.selectable).map(c=>c.skillId)});
   const before=snapshot(current);beforeReloadLogs.push(await nativeLog());
   const pending=await save();assert.equal(pending.readInt32LE(4),expectedSaveVersion);fs.writeFileSync(path.join(output,'pending-choice.vsgm1'),pending);
   await page().close();await boot({...options,expectedDialog:'commander-level-up',save:[...pending]});
   await wait(()=>goonkMobileState.dialogKind==='commander-level-up');current=await state();assert.deepEqual(snapshot(current),before,'Reload retains the acquired level and all pending offers');choiceReloads++;
  }
  const copy=(current.dialogPresentation?.lines||[]).join(' ').replace(/\s+/g,' ').trim();
  if(current.mode==='dialog'&&copy.startsWith('COMMANDER_DONE')){
   const expected=heroNegative?-1:reference?6000:cap?2147483647:suppressed?8500:reserve?5000-initialBaseline:baseline?3700:legacy?0:experience?(nonPaladin?5000:7500):raw;
   const commanderLevel=cap?75:suppressed?7:legacy||negative||wrap||heroNegative?1:nonPaladin||zeroRecalculation||baseline||reference?5:6;
   assert.equal(copy,`COMMANDER_DONE ${expected}/${experience}/${experience>0?5:heroNegative?0:1}${legacy?'':` CLEVEL ${commanderLevel} REF ${heroNegative?-1:experience?5000:0}`}${suppressed?' AFTER 0':''}`);done=true;break;
  }
  if(current.mode==='dialog'){
   let before=current;
   if(current.dialogKind==='commander-level-up'){
    order.push('commander');commanderLevels.push(current.dialogPresentation.commanderTree.level);const choice=current.dialogPresentation?.choices?.find(c=>c.selectable&&Number.isInteger(c.skillId));assert(choice);if(current.dialogPresentation.commanderTree.selectedSkill!==choice.skillId){await command(96,choice.skillId);await wait(id=>goonkMobileState.dialogPresentation?.commanderTree?.selectedSkill===id,choice.skillId);}before=await state();
   }else if(current.dialogKind==='hero-level-up'||current.dialogPresentation?.title==='Level up')order.push('hero');
   const previous=JSON.stringify({kind:before.dialogKind,title:before.dialogPresentation?.title,query:before.dialogPresentation?.queryId,lines:before.dialogPresentation?.lines,skills:before.dialogPresentation?.commanderTree?.skills?.map(s=>s.rank)});
   const selector=`.dialog-presentation[data-kind="${before.dialogKind||'message'}"] [data-dialog-confirm]`;
   if(!await page().locator(selector).isVisible()){await page().waitForTimeout(100);continue;}
   try{await page().locator(selector)[desktop?'click':'tap']({timeout:1500});}
   catch(error){const next=await state();if(next.mode!=='dialog'||next.dialogKind!==before.dialogKind||next.dialogPresentation?.queryId!==before.dialogPresentation?.queryId||next.dialogPresentation?.commanderTree?.level!==before.dialogPresentation?.commanderTree?.level||JSON.stringify(next.dialogPresentation?.lines)!==JSON.stringify(before.dialogPresentation?.lines))continue;throw error;}
   if(before.dialogKind==='commander-level-up')await wait(level=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogKind!=='commander-level-up'||goonkMobileState.dialogPresentation?.commanderTree?.level!==level,before.dialogPresentation.commanderTree.level);
   else await wait(previous=>{const s=goonkMobileState;return s.mode!=='dialog'||JSON.stringify({kind:s.dialogKind,title:s.dialogPresentation?.title,query:s.dialogPresentation?.queryId,lines:s.dialogPresentation?.lines,skills:s.dialogPresentation?.commanderTree?.skills?.map(s=>s.rank)})!==previous;},previous);
  }
  await page().waitForTimeout(100);
 }
 assert(done,'Original commander XP script completed');
 if(reserve||ai)assert.deepEqual(order,[]);
 else if(zeroRecalculation){assert(order.includes('commander'));assert(!order.includes('hero'));}
 else if(legacy){assert(order.includes('hero'));assert(!order.includes('commander'));}
 else if(experience>0){assert(order.includes('commander'));assert(order.includes('hero'));assert(order.lastIndexOf('commander')<order.indexOf('hero'),'Commander gains precede hero level choices');}else assert.deepEqual(order,[]);
 const complete=await save();fs.writeFileSync(path.join(output,'completed.vsgm1'),complete);
 const log=[...beforeReloadLogs,await nativeLog()].join('\n');fs.writeFileSync(path.join(output,'native-packets.log'),log);
 const packetOrder=[...log.matchAll(/Sending a pack of type \d+(CommanderLevelUp|HeroLevelUp)\b/g)].map(m=>m[1]);
 const expectedCommander=cap?74:suppressed?6:legacy||negative||wrap||heroNegative?0:nonPaladin||zeroRecalculation||baseline||reference?4:5;
 assert.deepEqual(packetOrder,[...Array(expectedCommander+choiceReloads).fill('CommanderLevelUp'),...Array(experience>0?4:0).fill('HeroLevelUp')]);
 if(!reserve&&!ai)assert.deepEqual(commanderLevels,Array.from({length:expectedCommander},(_,i)=>i+2),'Commander presentation uses the acquired rank');
 await page().screenshot({path:path.join(output,'commander-result.png')});
 if(checkpointLevel)assert.equal(choiceReloads,1);
 report.scenarios.push({choiceReloads,checkpointLevel,previousWordSave:!!previousWordSave,hero,type,nonPaladin,desktop,negative,wrap,zeroRecalculation,baseline,suppressed,reference,heroNegative,ai,cap,reserve,initialBaseline,legacy,raw,experience,order,commanderLevels,packetOrder,checkpointReload:true,rawWriteDoesNotLevel:true,completedText:await text()});await page().close();
}

export async function runCommanderBattleCheckpoint({boot,state,command,wait,approachEnemy,page,report,output,save}){
 const program=compileErm(Buffer.from('ZVSE\n!#CO6:X1/5000;\n!#IF:M^COMMANDER_BATTLE_READY^;'),{source:'Private original commander native battle checkpoint'});program.originalMessages=['ZVSE private native companion town continuation'];
 const options={enabled:false,scriptTown:true,scriptProgram:program,commanderWordFixture:{hero:'core:christian'},enemyCount:100,expectedDialog:'source-campaign',viewport:{width:390,height:844},levelArtifactChoice:0};
 await boot(options);assert.equal((await state()).dialogPresentation.lines.join(' '),'COMMANDER_BATTLE_READY');await page().locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='map');
 await approachEnemy();await wait(()=>goonkMobileState.mode==='battle');await command(15);
 let pending=null;
 for(let tick=0;tick<600;++tick){
  const s=await state();if(s.dialogKind==='commander-level-up'){pending=s;break;}
  assert.notEqual(s.dialogKind,'hero-level-up','Commander progression precedes hero progression');
  if(s.mode==='battle'&&s.canEndTactics)await command(35);
  else if(s.mode==='battle'&&s.canAutoCombat&&!s.autoCombat)await command(44,1);
  else if(s.mode==='dialog')await command(1);
  await page().waitForTimeout(100);
 }
 assert(pending,'Native victory produces the pending commander choice');
 // The battle still owns its continuation here. This is deliberately outside
 // the admitted checkpoint boundary; save only after its native completion.
 assert.equal(pending.autosaveAllowed,false,'Unfinished native battles remain outside the save boundary');
 const level=pending.dialogPresentation.commanderTree.level,skills=pending.dialogPresentation.commanderTree.skills.map(s=>s.rank);
 const levels=[];
 for(let tick=0;tick<600;++tick){
  const s=await state();
  if(s.mode==='map'&&s.turn&&!s.hasPath){await page().waitForTimeout(400);if((await state()).mode==='map')break;}
  if(s.mode==='dialog'){
   if(s.dialogKind==='commander-level-up'){
    levels.push(s.dialogPresentation.commanderTree.level);const choice=s.dialogPresentation.choices.find(c=>c.selectable&&Number.isInteger(c.skillId));assert(choice);await command(96,choice.skillId);await wait(id=>goonkMobileState.dialogPresentation?.commanderTree?.selectedSkill===id,choice.skillId);
   }
   await command(1);await page().waitForTimeout(250);
  }
  await page().waitForTimeout(100);
 }
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.autosaveAllowed);assert(levels.length>0);assert.equal(new Set(levels).size,levels.length,'Native battle resumes each acquired commander level once');
 const completed=await save();fs.writeFileSync(path.join(output,'battle-completed.vsgm1'),completed);await page().screenshot({path:path.join(output,'battle-completed.png')});await page().close();await boot({...options,save:[...completed],expectedDialog:null});await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);report.scenarios.push({nativeBattle:true,checkpointReload:true,reloadPhase:'completed-native-battle',pendingBattleSaveAllowed:false,level,skills,levels,returnedToMap:true});await page().close();
}
