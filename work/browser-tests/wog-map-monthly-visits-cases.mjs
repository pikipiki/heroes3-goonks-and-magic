import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

export async function runMonthlyVisits({boot,state,command,wait,walk,nextDay,page,output,report,readCompletedNativeSave}){
 const desktop=process.env.CASES==='monthly-desktop',portrait=process.env.MONTHLY_PORTRAIT==='1';
 const control=process.env.CASES==='monthly-control';
 const matrix=control?[[true,null,false]]:desktop||portrait?[[false,1,true],[true,0,false]]:
  [[false,-1,false],[true,-1,true],[false,1,true],[true,0,false],[false,0,false],[true,1,true]];
 const skills=async()=>{
  await page().locator('[data-ui=heroes]')[desktop?'click':'tap']();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);
  const result=(await state()).heroWindow.primarySkills;await command(0);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);return result;
 };
 if(process.env.MONTHLY_OLD_SAVE){
  await boot({enabled:false,monthlyConfigured:true,save:[...fs.readFileSync(process.env.MONTHLY_OLD_SAVE)]});
  const before=await skills();assert.equal((await state()).day,28);await nextDay();assert.equal((await state()).day,29);
  await walk(1,-1);await walk(-1,1);assert.deepEqual(await skills(),before,'A fifteen-choice save never inherits a new monthly reset');
  report.scenarios.push({legacyFifteenChoiceSave:true,monthlyRemainsDisabled:true,continuedNewMonth:true});await page().close();return;
 }
 for(const [configured,choice,active]of matrix){
  const options={enabled:false,monthlyFixture:true,monthlyConfigured:configured,monthlyChoice:choice,...(portrait?{viewport:{width:390,height:844}}:{})};
  await boot(options);const initial=await skills();let atTower=false;
  const visitBoth=async()=>{await walk(atTower?1:2,atTower?-1:0);await walk(-1,1);atTower=true;};
  await visitBoth();const first=await skills();
  assert.equal(first[0],initial[0]+1,'Mercenary Camp first reward');assert.equal(first[1],initial[1]+1,'Marletto Tower first reward');
  await visitBoth();assert.deepEqual(await skills(),first,'No repeat reward during the same month');
  while((await state()).day<28)await nextDay();
  await visitBoth();assert.deepEqual(await skills(),first,'Day28 is not a new month');
  const bytes=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,`monthly-day28-${configured}-${choice}.vsgm1`),bytes);
  await page().close();await boot({...options,monthlyConfigured:!configured,save:[...bytes]});
  assert.deepEqual(await skills(),first,'Visited sites survive save/load');await nextDay();assert.equal((await state()).day,29);
  await visitBoth();const second=await skills();
  assert.equal(second[0],first[0]+Number(active),'Mercenary Camp new month');assert.equal(second[1],first[1]+Number(active),'Marletto Tower new month');
  const resetBytes=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,`monthly-day29-${configured}-${choice}.vsgm1`),resetBytes);
  await page().close();await boot({...options,monthlyConfigured:!configured,save:[...resetBytes]});
  await visitBoth();assert.deepEqual(await skills(),second,'Day29 native load never replays the reset');
  await nextDay();await visitBoth();assert.deepEqual(await skills(),second,'Day30 does not reset visits');
  await page().screenshot({path:path.join(output,`monthly-${configured}-${choice}.png`)});
  report.scenarios.push({configured,choice,active,initial,first,second,day28NoReset:true,day29Reset:active,day30NoReset:true,nativeSaveReload:true,reversedGlobalDefault:true,noResetReplay:true,viewport:page().viewportSize(),input:desktop?'mouse':'touch'});
  await page().close();
 }
}
