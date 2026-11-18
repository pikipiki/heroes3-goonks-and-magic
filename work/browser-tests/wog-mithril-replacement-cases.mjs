import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export function replacementSourceFixture(interval=0,observeReady=false){
 let source=`ZVSE2
!#VRi^wog_36_79_interval^:S${interval};
!#VRs^wog_36_79_interval^:S^paired^;
!#VRi^wog_170_79_interval^:S999;
!#VRi^wog_170_79_num^:S888;
!#UN:P170/?v7170;
!#IF:M^REPLACEMENT INIT %V7170^;
!?GE2;
!!UN:P170/?v7170;
!!VRv7171:Si^wog_36_79_interval^;
!!VRv7172:Si^wog_170_79_interval^;
!!VRv7173:Si^wog_170_79_num^;
!!VRz41:Ss^wog_36_79_interval^;
!!IF:M^REPLACEMENT NEXT %V7170/%V7171/%V7172/%V7173/%Z41^;`;
 if(observeReady)source=source.replace('!?GE2;',`!?GE1;
!!UN:P170/?v7170;
!!VRv7171:Si^wog_36_79_interval^;
!!VRv7172:Si^wog_170_79_interval^;
!!VRv7173:Si^wog_170_79_num^;
!!VRz41:Ss^wog_36_79_interval^;
!!IF:M^REPLACEMENT READY %V7170/%V7171/%V7172/%V7173/%Z41^;
!?GE2;`);
 const p=compileErm(source,{source:'Private native source170 counter and option probe'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runMithrilResourceReplacement({boot,walk,state,command,wait,page,report,output,save}){
 const rows=[
  {name:'gold',resource:'gold',amount:500,expected:3,sourceResource:6},
  {name:'guarded',resource:'gold',amount:500,expected:3,sourceResource:6,guarded:true},
  {name:'wood',resource:'wood',amount:9,expected:5,sourceResource:0},
  {name:'rare',resource:'gems',amount:9,expected:9,sourceResource:5},
  {name:'large',resource:'gold',amount:1000,expected:0,sourceResource:6},
  {name:'small',resource:'gems',amount:1,expected:0,sourceResource:5},
  {name:'native-fractional-gold',resource:'gold',amount:550,expected:0,sourceResource:6},
  {name:'campfire',campfire:true},
  {name:'shared-counter',resource:'gold',amount:500,expected:3,sourceResource:6,prefix:2},
 ];
 const filtered=process.env.MITHRIL_REPLACEMENT_ONLY?rows.filter(r=>process.env.MITHRIL_REPLACEMENT_ONLY.split(',').includes(r.name)):rows;
 for(const row of filtered){
  const configured=process.env.MITHRIL_REPLACEMENT_GLOBAL==='1';
  const choice=process.env.MITHRIL_REPLACEMENT_CHOICE!==undefined?Number(process.env.MITHRIL_REPLACEMENT_CHOICE):process.env.MITHRIL_REPLACEMENT_OFF==='1'?0:1;
  const active=choice<0?configured:choice===1;
  const observeReady=process.env.MITHRIL_REPLACEMENT_OBSERVE_READY==='1';
  const scriptProgram=replacementSourceFixture(row.prefix||0,observeReady);
  const options={replacementFixture:{...row,observeReady},scriptProgram,resourceMithrilChoice:choice,weeklyMithrilChoice:0,enabled:configured,nativeSeed:11,funds:0,
   ...(process.env.MITHRIL_REPLACEMENT_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  await boot({...options,expectedDialog:'source-campaign'});
  await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(s=>s.includes('REPLACEMENT INIT')));
  assert((await state()).dialogPresentation.lines.join(' ').includes(`REPLACEMENT INIT ${active?1:0}`));
  await page().locator('[data-dialog-confirm]')[process.env.CASES?.endsWith('-desktop')?'click':'tap']();
  let readyCounterMessage=null;
  if(observeReady){await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(s=>s.includes('REPLACEMENT READY')));readyCounterMessage=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]')[process.env.CASES?.endsWith('-desktop')?'click':'tap']();}
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const bytes=await save();fs.writeFileSync(path.join(output,`${row.name}-ready.vsgm1`),bytes);assert.equal(Buffer.from(bytes).readInt32LE(4),924);
  await page().close();await boot({...options,enabled:!configured,save:[...bytes]});
  if(!active&&row.guarded){
   await command(6);await page().waitForTimeout(150);const point=await page().evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+32,y:v.y+v.h/2};});
   await page().evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='battle');
   assert((await state()).battleUnits.some(u=>u.enemy&&u.key==='core:peasant'));
   report.scenarios.push({kind:'mithril-resource-guard-control',active:false,originalGuardsRetained:true,nativeSaveReloadBeforePickup:true});await page().close();continue;
  }
  const before=(await state()).resources;await walk(1);const after=(await state()).resources,delta=after.map((n,i)=>n-(before[i]||0));
  if(row.campfire){
   if(active){assert(delta[7]>=4&&delta[7]<=6,JSON.stringify(delta));assert.equal(delta[6],delta[7]*100);}
   else{assert.equal(delta[7],0);assert(delta[6]>=400&&delta[6]<=600);assert.equal(delta.slice(0,6).reduce((a,b)=>a+b,0)*100,delta[6]);}
  }else if(active&&row.expected){assert.equal(delta[7],row.expected,JSON.stringify(delta));assert.equal(delta[row.sourceResource],0);}
  else{assert.equal(delta[7],0);assert.equal(delta[row.sourceResource],row.amount);}
  await command(3);await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(s=>s.includes('REPLACEMENT NEXT')));
  const text=(await state()).dialogPresentation.lines.join(' '),match=text.match(/REPLACEMENT NEXT (\d+)\/(-?\d+)\/(-?\d+)\/(-?\d+)\/paired/);assert(match,text);
  if(readyCounterMessage){const ready=readyCounterMessage.match(/REPLACEMENT READY (\d+)\/(-?\d+)\/(-?\d+)\/(-?\d+)\/paired/);assert(ready,readyCounterMessage);assert.deepEqual(match.slice(1),ready.slice(1),'The initial map pass must not run again on the next day after reload');}
  assert.equal(Number(match[1]),active?1:0);assert.equal(Number(match[3]),0);assert.equal(Number(match[4]),active?0:888);
  if(active&&!row.campfire){if(row.expected)assert(Number(match[2])>=0&&Number(match[2])<=35);else assert.equal(Number(match[2]),-1);}
  else if(!active)assert.equal(Number(match[2]),row.prefix||0);
  await page().locator('[data-dialog-confirm]')[process.env.CASES?.endsWith('-desktop')?'click':'tap']();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  report.scenarios.push({kind:'mithril-resource-replacement',name:row.name,active,delta,source36Disabled:!configured,source171Disabled:true,globalModule:configured,choice,source170FrozenAcrossChangedDefaults:true,nativeSaveReloadBeforePickup:true,sourceCounterMessage:text,readyCounterMessage,oneTimePassPreserved:!!readyCounterMessage,pairedStringPreserved:true,nativeSaveVersion:924,viewport:page().viewportSize(),input:process.env.CASES?.endsWith('-desktop')?'mouse':'touch'});await page().close();
 }
}
export async function runReplacementLegacy({boot,walk,state,page,report,output,save}){
 const old=process.env.MITHRIL_REPLACEMENT_LEGACY_SAVE;
 const options={replacementFixture:{resource:'gold',amount:500},weeklyMithrilChoice:0,enabled:false,nativeSeed:11,funds:0};
 await boot({...options,...(old?{save:[...fs.readFileSync(old)],enabled:true}:{})});
 const bytes=await save();fs.writeFileSync(path.join(output,'legacy-resource.vsgm1'),bytes);const version=Buffer.from(bytes).readInt32LE(4);
 if(old){
  assert.equal(version,924);const before=(await state()).resources;await walk(1);const after=(await state()).resources,delta=after.map((n,i)=>n-(before[i]||0));assert.equal(delta[6],500);assert.equal(delta[7],0);
  report.scenarios.push({kind:'mithril-replacement-legacy-consumer',inputVersion:Buffer.from(fs.readFileSync(old)).readInt32LE(4),outputVersion:version,delta,noRetroactiveReplacement:true});
 }else report.scenarios.push({kind:'mithril-replacement-legacy-producer',version,day:(await state()).day,originalGold:500});
 await page().close();
}
