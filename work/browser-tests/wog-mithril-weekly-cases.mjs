import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runWeeklyMithril({boot,panel,buy,walk,nextDay,state,command,wait,page,report,output,save}){
 const modes=process.env.MITHRIL_WEEKLY_ONLY?[process.env.MITHRIL_WEEKLY_ONLY]:['enabled','disabled','baseline'];
 for(const mode of modes){
  const upgraded=mode!=='baseline',weeklyMithrilChoice=mode==='disabled'?0:1;
  const options={reroll:'payout',weeklyMithrilChoice,...(process.env.MITHRIL_WEEKLY_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  await boot(options);let data=await panel();const wheel=data.offers.find(row=>row.id===7&&row.kind===2);assert(wheel);
  if(upgraded)await buy(wheel);
  await page().locator('[data-mithril-close]')[process.env.CASES?.endsWith('-desktop')?'click':'tap']();
  await wait(()=>goonkMobileState.mode==='map');
  const saved=await save();fs.writeFileSync(path.join(output,`weekly-${mode}-purchased.vsgm1`),saved);
  await page().close();await boot({...options,save:[...saved],enabled:false});
  const rewards=[];
  for(const day of [1,8,15]){
   while((await state()).day<day){await panel();await nextDay();}
   if(day>1)await walk(-1);
   const gold=(await state()).resources[6];await walk(1);const reward=(await state()).resources[6]-gold;
   const expected=day===1?500:mode==='enabled'?2000:1000;assert.equal(reward,expected,`Stored wheel payout on day${day}, ${mode}`);rewards.push(reward);
   if(day===8){
    const bytes=await save();fs.writeFileSync(path.join(output,`weekly-${mode}-day8.vsgm1`),bytes);await page().close();await boot({...options,save:[...bytes],enabled:false});
   }
  }
  report.scenarios.push({kind:'mithril-weekly-waterwheel',mode,weeklyMithrilChoice,upgraded,rewards,days:[1,8,15],purchaseDoesNotDoubleCurrentStock:rewards[0]===500,noCompounding:rewards[1]===rewards[2],frozenChoiceAcrossChangedDefaults:true,nativeSaveReload:true,viewport:page().viewportSize(),input:process.env.CASES?.endsWith('-desktop')?'mouse':'touch'});await page().close();
 }
}
export async function runWeeklySourceSeeds({boot,walk,state,page,report}){
 const seeds=(process.env.MITHRIL_WEEKLY_SEEDS||'1').split(',').map(Number);
 const kinds=process.env.MITHRIL_WEEKLY_KIND?[process.env.MITHRIL_WEEKLY_KIND]:['garden','windmill'];
 for(const kind of kinds)for(const seed of seeds){
  const weeklyMithrilChoice=Number(process.env.MITHRIL_WEEKLY_SOURCE_CHOICE??1);
  await boot({reroll:'weekly-'+kind,weeklyMithrilChoice,enabled:false,nativeSeed:seed,funds:0});
  const before=(await state()).resources;await walk(1);const after=(await state()).resources;
  const delta=after.map((value,i)=>value-(before[i]||0));
  if(delta[7])assert.equal(delta[7],kind==='garden'?5:delta[7]);
  if(kind==='windmill')assert(delta.some((n,i)=>i>=1&&i<=7&&n>=3&&n<=6));
  else assert(delta[5]===5||delta[6]===500||delta[7]===5,JSON.stringify(delta));
  if(process.env.MITHRIL_WEEKLY_EXPECT_MITHRIL==='1')assert(delta[7]>0);
  if(weeklyMithrilChoice===0)assert.equal(delta[7],0);
  report.scenarios.push({kind:'mithril-weekly-source-reward',site:kind,seed,weeklyMithrilChoice,source36Disabled:true,delta,viewport:page().viewportSize()});await page().close();
 }
}
export async function runLegacyWeeklyWheel({boot,panel,buy,walk,nextDay,state,page,report,output,save}){
 const old=process.env.MITHRIL_WEEKLY_LEGACY_SAVE;
 await boot({reroll:'payout',...(old?{save:[...fs.readFileSync(old)],enabled:false}:{})});
 let data=await panel();const wheel=data.offers.find(row=>row.id===7&&row.kind===2);assert(wheel);
 if(!old)await buy(wheel);else assert(!wheel.available);
 await page().locator('[data-mithril-close]').tap();
 const bytes=await save();const file=path.join(output,'legacy-wheel-purchased.vsgm1');fs.writeFileSync(file,bytes);
 const version=Buffer.from(bytes).readInt32LE(4);
 if(old){
  assert.equal(version,923);const gold=(await state()).resources[6];await walk(1);assert.equal((await state()).resources[6]-gold,1000);
  for(let day=2;day<=8;++day){await panel();await nextDay();}
  await walk(-1);const secondGold=(await state()).resources[6];await walk(1);assert.equal((await state()).resources[6]-secondGold,2000);
  report.scenarios.push({kind:'mithril-weekly-legacy-consumer',inputSaveVersion:Buffer.from(fs.readFileSync(old)).readInt32LE(4),outputSaveVersion:version,rewards:[1000,2000],legacyImmediateRewardPreserved:true,source171NotRetroactivelyEnabled:true});
 }else report.scenarios.push({kind:'mithril-weekly-legacy-producer',nativeSaveVersion:version,purchasedWheel:true});
 await page().close();
}
export function weeklySourceOptionFixture(){
 const query=(prefix,step)=>`${prefix}UN:P171/?v7171;\n${prefix}IF:M^WEEKLY OPTION ${step} %V7171^;`;
 const p=compileErm('ZVSE2\n'+query('!#',1)+'\n!?GE2;\n'+query('!!',2),{source:'Private native weekly Mithril option query'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runWeeklySourceOption({boot,state,wait,command,page,report,output,save}){
 const scriptProgram=weeklySourceOptionFixture();
 for(const [enabled,weeklyMithrilChoice,active]of [[false,1,true],[true,0,false],[true,-1,true],[false,-1,false]]){
  const options={enabled,weeklyMithrilChoice,sourceOptions:true,scriptProgram};
  const read=async step=>{await wait(step=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(s=>s.includes('WEEKLY OPTION '+step)),step);const text=(await state()).dialogPresentation.lines.join(' ');assert(text.includes(`WEEKLY OPTION ${step} ${active?1:0}`),text);return text;};
  const ack=()=>page().locator('[data-dialog-confirm]').tap();
  await boot({...options,expectedDialog:'source-campaign'});const initial=await read(1);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const bytes=await save();fs.writeFileSync(path.join(output,`weekly-option-${enabled}-${weeklyMithrilChoice}.vsgm1`),bytes);await page().close();await boot({...options,enabled:!enabled,save:[...bytes]});
  await command(3);const next=await read(2);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  report.scenarios.push({kind:'mithril-weekly-source-option',globalModule:enabled,choice:weeklyMithrilChoice,active,initial,next,sourceOption:171,frozenAcrossChangedDefaults:true,nativeSaveReload:true});await page().close();
 }
}
export async function runWindmillWeeklyUpgrade({boot,panel,buy,walk,nextDay,state,page,report,output,save}){
 const pairs=[];
 for(const upgraded of [false,true]){
  const options={reroll:'weekly-windmill',weeklyMithrilChoice:1,nativeSeed:11};
  await boot(options);const data=await panel(),mill=data.offers.find(row=>row.id===7&&row.kind===2);assert(mill);
  if(upgraded)await buy(mill);await page().locator('[data-mithril-close]').tap();
  const rewards=[];
  for(const day of [1,8,15]){
   while((await state()).day<day){await panel();await nextDay();}
   if(day>1)await walk(-1);
   const before=(await state()).resources;await walk(1);const after=(await state()).resources;rewards.push(after.map((n,i)=>n-(before[i]||0)));
   if(day===8){const bytes=await save();fs.writeFileSync(path.join(output,`windmill-${upgraded}-day8.vsgm1`),bytes);await page().close();await boot({...options,enabled:false,save:[...bytes]});}
  }
  pairs.push(rewards);await page().close();
 }
 assert.deepEqual(pairs[1][0],pairs[0][0],'Buying does not change the current windmill stock');
 for(let week=1;week<3;++week)assert.deepEqual(pairs[1][week],pairs[0][week].map(n=>n*2),'Upgraded windmill doubles the freshly regenerated stock exactly once');
 report.scenarios.push({kind:'mithril-weekly-windmill-upgrade',seed:11,baseline:pairs[0],upgraded:pairs[1],days:[1,8,15],nativeSaveReload:true,purchaseDoesNotDoubleCurrentStock:true,weeklyStockDoubledOnce:true});
}
