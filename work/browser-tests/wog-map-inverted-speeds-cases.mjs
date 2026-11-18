import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function invertedSpeedFixture(){
 const code=`!#MA:S4/1 S98/20 S6/2000 S146/9999 S182/8888 P88/101 A88/17 D88/18 M88/19 E88/20;
!?HE0;
!!MA:S4/?v810 S4/d+1 S4/?v811 S98/?v812 S6/?v813 S146/?v814 S182/?v815;
!!MA:P88/d+1 A88/d+1 D88/d+1 M88/d+1 E88/d+1;
!!MA:P88/?v816 A88/?v817 D88/?v818 M88/?v819 E88/?v820;
!!IF:M^SPEED %V810 %V811 %V812 %V813 %V814 %V815 ATTR %V816 %V817 %V818 %V819 %V820^;`;
 const p=compileErm(Buffer.from(code),{source:'Private WoG112 live MA:S read/write and excluded maxima'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}

export async function runInvertedSpeeds({boot,state,command,wait,page,output,report,readCompletedNativeSave}){
 const desktop=process.env.CASES==='inverted-speeds-desktop',portrait=process.env.SPEED_PORTRAIT==='1';
 const scriptProgram=invertedSpeedFixture();fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const cases=process.env.SPEED_PROBE==='1'?[[false,1,true]]:process.env.SPEED_OLD_PRODUCER||process.env.SPEED_LEGACY_SAVE?[[false,null,false]]:
  desktop||portrait?[[false,1,true],[true,0,false]]:[[false,-1,false],[true,-1,true],[false,1,true],[true,0,false],[false,0,false],[true,1,true]];
 for(const [configured,choice,active]of cases){
  const options={enabled:false,creatureRuleFixture:true,ruleActor:'core:griffin',scriptProgram,invertedSpeedsConfigured:configured,invertedSpeedsChoice:choice,...(portrait?{viewport:{width:390,height:844}}:{})};
  await boot(process.env.SPEED_LEGACY_SAVE?{...options,invertedSpeedsConfigured:true,save:[...fs.readFileSync(process.env.SPEED_LEGACY_SAVE)]}:options);
  const saved=await readCompletedNativeSave(page(),command,{tag:832});fs.writeFileSync(path.join(output,`speed-${report.scenarios.length}.vsgm1`),saved);
  if(process.env.SPEED_OLD_PRODUCER){report.scenarios.push({legacyProducer:true,nativeSaveVersion:saved.readInt32LE(4)});await page().close();return;}
  await page().close();await boot({...options,save:[...saved],invertedSpeedsConfigured:!configured});
  await command(6);await page().waitForTimeout(150);
  const point=await page().evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+32,y:v.y+v.h/2};});
  await page().evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);
  await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(t=>t.startsWith('SPEED ')));
  const message=(await state()).dialogPresentation.lines.find(t=>t.startsWith('SPEED '));
  const expected=active?[2002,2003,1983,3,9999,8888]:[1,2,20,2000,9999,8888];
  assert.equal(message,'SPEED '+expected.join(' ')+' ATTR 102 18 19 20 21','Raw MA:S sees the live map table, then relative writes replace its value');
  const pending=await readCompletedNativeSave(page(),command,{tag:833});fs.writeFileSync(path.join(output,`speed-pending-${report.scenarios.length}.vsgm1`),pending);
  await page().close();await boot({...options,save:[...pending],invertedSpeedsConfigured:!configured,expectedDialog:'source-campaign'});
  assert.equal((await state()).dialogPresentation.lines.find(t=>t.startsWith('SPEED ')),message);
  const confirm=page().locator('[data-dialog-confirm]:visible');await confirm.waitFor({state:'visible'});assert.equal(await confirm.count(),1);
  await confirm[desktop?'click':'tap']();await wait(()=>goonkMobileState.mode==='battle');await command(15);
  await wait(()=>goonkMobileState.battleUnits?.some(u=>u.key==='core:griffin'));
  const battle=await state(),actor=battle.battleUnits.find(u=>u.key==='core:griffin'),enemy=battle.battleUnits.find(u=>u.key==='core:gnoll');assert(actor&&enemy);
  assert.equal(actor.speed,expected[1]+1,'Native grass terrain adds one after the authored raw speed');assert.equal(enemy.speed,expected[2]);
  assert(actor.nativeFlags.flying,'Rule112 does not change flight');
  fs.writeFileSync(path.join(output,`battle-${report.scenarios.length}.json`),JSON.stringify(battle,null,2));
  await page().screenshot({path:path.join(output,`battle-${report.scenarios.length}.png`)});
  report.scenarios.push({configured,choice,active,message,rawSpeeds:expected,battleSpeeds:{actor:actor.speed,enemy:enemy.speed,nativeGrassBonus:1},nativeSaveVersion:saved.readInt32LE(4),nativeSaveReload:true,pendingNativeSaveReload:true,pendingDialogConfirmedByPointer:true,reversedGlobalDefault:true,noInversionReplay:true,legacyEighteenChoiceSave:!!process.env.SPEED_LEGACY_SAVE,viewport:page().viewportSize(),input:desktop?'mouse':'touch'});
  await page().close();
 }
}
