import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runCommanderWords({boot,state,command,wait,page,report,output,save}){
 // Hero IDs pinned to the bundled ERA constants, not inferred from names.
 const heroes=[['christian',6],['ivor',21],['solmyr',45],['marius',50],['sandro',74],['mutare',151],['cragHack',102],['tazar',115],['luna',136]];
 const type=Number(process.env.COMMANDER_FACTION??(process.env.COMMANDER_NON_PALADIN==='1'?1:0));assert(heroes[type]);
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
 await boot({...options,...(legacySave?{save:[...fs.readFileSync(legacySave)]}:{})});
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
 assert.equal(bytes.readInt32LE(4),941);
 await page().close();await boot({...options,save:[...bytes]});assert.equal(await text(),checkpointText);
 const initialQuery=(await state()).dialogPresentation?.queryId;
 await page().locator('[data-dialog-confirm]')[desktop?'click':'tap']();
 await wait(id=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==id,initialQuery);
 const order=[],commanderLevels=[];let done=false;
 for(let tick=0;tick<600;++tick){
  const current=await state(),copy=(current.dialogPresentation?.lines||[]).join(' ').replace(/\s+/g,' ').trim();
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
 const log=await page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));fs.writeFileSync(path.join(output,'native-packets.log'),log);
 const packetOrder=[...log.matchAll(/Sending a pack of type \d+(CommanderLevelUp|HeroLevelUp)\b/g)].map(m=>m[1]);
 const expectedCommander=cap?74:suppressed?6:legacy||negative||wrap||heroNegative?0:nonPaladin||zeroRecalculation||baseline||reference?4:5;
 assert.deepEqual(packetOrder,[...Array(expectedCommander).fill('CommanderLevelUp'),...Array(experience>0?4:0).fill('HeroLevelUp')]);
 if(!reserve&&!ai)assert.deepEqual(commanderLevels,Array.from({length:expectedCommander},(_,i)=>i+2),'Commander presentation uses the acquired rank');
 await page().screenshot({path:path.join(output,'commander-result.png')});
 report.scenarios.push({hero,type,nonPaladin,desktop,negative,wrap,zeroRecalculation,baseline,suppressed,reference,heroNegative,ai,cap,reserve,initialBaseline,legacy,raw,experience,order,commanderLevels,packetOrder,checkpointReload:true,rawWriteDoesNotLevel:true,completedText:await text()});await page().close();
}
