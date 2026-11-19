import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
import {revealNativeAction} from './native-ui-actions.mjs';

export function siteTilesProgram(row,{legacy=false}={}){
 const source=`ZVSE
${legacy?'':`!#PO9/11/0:N${row.initial};`}
!#IF:M^SITE READY^;
${Array.from({length:14},(_,i)=>{const day=i+2;return `!?GE${day};\n!!PO9/11/0:N?v20;\n!!IF:M^SITE DAY ${day} %V20^;`+(day===2?`\n!!PO9/11/0:N${row.edit};\n!!PO9/11/0:N?v21;\n!!IF:M^SITE EDIT %V21^;`:'');}).join('\n')}`;
 const p=compileErm(Buffer.from(source),{source:'Private source42 shared mill and university tile markers'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runSiteTiles(api){
 const {boot,panel,buy,state,command,wait,walk,page,output,report,readCompletedNativeSave}=api;
 const mouse=process.env.CASES.endsWith('-desktop'),press=mouse?'click':'tap';
 const producer=process.env.SITE_TILES_LEGACY_PRODUCER==='1',legacy=process.env.SITE_TILES_LEGACY_SAVE;
 const legacyKind=process.env.SITE_TILES_LEGACY_KIND||'wheel';
 const firstWeek=process.env.SITE_TILES_FIRST_WEEK_CONTROL==='1';
 const rows=firstWeek?[{name:'initial-wheel-marker',kind:'wheel',initial:2,edit:2,enabled:false,weekly:true}]:producer||legacy?[{name:'legacy-'+legacyKind,kind:legacyKind,initial:0,purchase:true,edit:0,enabled:true,weekly:true}]:[
  {name:'wheel-purchase-custom',kind:'wheel',initial:0,purchase:true,edit:5,enabled:true,weekly:true},
  {name:'wheel-script-clear',kind:'wheel',initial:2,edit:0,enabled:true,weekly:true},
  {name:'wheel-source36-off',kind:'wheel',initial:5,edit:5,enabled:false,weekly:true},
  {name:'wheel-source171-off',kind:'wheel',initial:2,edit:2,enabled:true,weekly:false},
  {name:'windmill-baseline',kind:'windmill',initial:0,edit:0,enabled:false,weekly:true},
  {name:'windmill-custom',kind:'windmill',initial:5,edit:5,enabled:false,weekly:true},
  {name:'university-purchase',kind:'university',initial:0,purchase:true,edit:2,enabled:true,weekly:true},
  {name:'university-source36-off',kind:'university',initial:2,edit:2,enabled:false,weekly:false},
  {name:'university-other-subtype',kind:'university',subtype1:true,initial:2,edit:2,enabled:true,weekly:true},
  {name:'university-marker1',kind:'university',initial:1,edit:1,enabled:true,weekly:true},
  {name:'university-marker3',kind:'university',initial:3,edit:3,enabled:true,weekly:true},
  {name:'university-script-clear',kind:'university',initial:2,edit:0,enabled:true,weekly:true},
 ];
 const read=text=>wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);
 const ack=async()=>{const s=await state(),before={text:s.dialogPresentation?.lines?.join(' '),query:s.dialogPresentation?.queryId};await page().locator('[data-dialog-confirm]')[press]();await wait(before=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==before.query||goonkMobileState.dialogPresentation?.lines?.join(' ')!==before.text,before);};
 const settle=async()=>{for(let i=0;i<600;i++){const s=await state();if(s.mode==='map'&&s.turn)return;if(s.mode==='dialog'){const text=s.dialogPresentation?.lines?.join(' ')||'';assert(!text.startsWith('SITE '),text);await ack();}await page().waitForTimeout(50);}throw Error('Site map did not settle');};
 const close=async()=>{if(await page().locator('.mithril-panel').isVisible())await page().locator('[data-mithril-close]')[press]();};
 const advance=async(day,marker)=>{await close();await command(3);const expected=`SITE DAY ${day} ${marker}`;for(let i=0;i<600;i++){const s=await state(),text=s.dialogPresentation?.lines?.join(' ')||'';if(text===expected)return;if(s.mode==='dialog'){assert(!text.startsWith('SITE '),text);await ack();}await page().waitForTimeout(50);}throw Error('Missing '+expected);};
 const nativeSave=async(name,version)=>{const bytes=await readCompletedNativeSave(page(),command);assert.equal(bytes.readInt32LE(4),version);fs.writeFileSync(path.join(output,name+'.vsgm1'),bytes);return bytes;};
 for(const row of rows.filter(r=>!process.env.SITE_TILES_CASES||process.env.SITE_TILES_CASES.split(',').includes(r.name))){
  const university=row.kind==='university',scriptProgram=siteTilesProgram(row,{legacy:producer||!!legacy});
  fs.writeFileSync(path.join(output,row.name+'-program.json'),JSON.stringify(scriptProgram,null,2));
  const options={enabled:row.enabled,wogChoice:row.enabled?1:0,weeklyMithrilChoice:row.weekly?1:0,siteTilesFixture:true,siteTilesSubtype:!!row.subtype1,scriptProgram,nativeSeed:1,reroll:university?'university':row.kind==='wheel'?'payout':'weekly-windmill',...(process.env.SITE_TILES_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  const target=async()=>{const data=await panel();return data.offers.find(r=>r.x===9&&r.y===11);};
  const active=marker=>university?marker===2&&!row.subtype1:marker!==0;let blockedPurchaseRejected=false;
  if(legacy){await boot({...options,enabled:false,save:[...fs.readFileSync(legacy)]});await settle();assert.equal((await target()).active,true);}
  else{
   await boot({...options,expectedDialog:'source-campaign'});await read('SITE READY');await ack();await settle();
   if(row.enabled){const offer=await target();if(university&&row.initial!==0&&(row.initial!==2||row.subtype1))assert.equal(offer,undefined);else{assert(offer);assert.equal(offer.active,active(row.initial));}}
   else assert.equal((await state()).mithrilEnabled,false);
   if(row.enabled&&row.initial!==0){const data=await panel();await command(1200,7,0,data.revision);await page().waitForTimeout(250);const current=await state();assert.equal(current.mithril.amount,data.amount);assert.equal(current.mithril.revision,data.revision);blockedPurchaseRejected=true;}
   if(row.purchase){const offer=await target();assert(offer.available);assert.equal(offer.cost,university?4:5);await buy(offer);assert.equal((await target()).active,true);}
  }
  if(firstWeek){await close();const before=(await state()).resources[6];await walk(1);const payout=(await state()).resources[6]-before;assert.equal(payout,Number(process.env.SITE_TILES_FIRST_WEEK_EXPECT||1000));report.scenarios.push({kind:'initial-week-source-marker-control',sourceMarker:2,source36:false,source171:true,nativePayout:payout,sourceExpectedPayout:1000,sourceFirstWeekParity:payout===1000});await page().close();continue;}
  if(producer){await nativeSave('legacy-'+row.kind,930);report.scenarios.push({kind:'legacy-site-producer',site:row.kind,saveVersion:930,physicalPurchase:true});await page().close();continue;}
  const purchasedMarker=row.purchase||legacy?2:row.initial;
  await advance(2,purchasedMarker);const pending=await nativeSave(row.name+'-pending',931);await page().close();
  await boot({...options,enabled:!row.enabled,save:[...pending],expectedDialog:'source-campaign'});await read(`SITE DAY 2 ${purchasedMarker}`);await ack();await read(`SITE EDIT ${row.edit}`);await ack();await settle();
  const edited=await nativeSave(row.name+'-edited',931);await page().close();await boot({...options,enabled:!row.enabled,save:[...edited]});await settle();
  if(row.enabled){const offer=await target();if(university&&row.edit!==0&&(row.edit!==2||row.subtype1))assert.equal(offer,undefined);else{assert(offer);assert.equal(offer.active,active(row.edit));if(row.edit===0)assert(offer.available);}}
  await close();
  let rewards=[],skills=[],lesson=false;
  if(university){
   await command(6);await page().waitForTimeout(150);const point=await page().evaluate(()=>{const v=goonkMobileState.mapOverview.view;return{x:v.x+v.w/2+32,y:v.y+v.h/2};});
   await page().evaluate(p=>Module._vcmiMobilePointer(p.x,p.y,1),point);await wait(()=>goonkMobileState.hasPath);await command(2);await wait(()=>goonkMobileState.mode==='dialog');const balance=(await state()).resources[6];await page().locator('[data-ui=accept]')[press]();await wait(()=>goonkMobileState.mode!=='dialog'||!!goonkMobileState.dialogPresentation);
   if(row.edit===2&&!row.subtype1){
    await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.choices?.some(c=>/3000/.test(c.label)));
    const price=(await state()).dialogPresentation;assert(price.cancel);await ack();
    await wait(queryId=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.queryId!==queryId&&goonkMobileState.dialogPresentation?.choices?.length===1,price.queryId);
    assert.equal((await state()).resources[6],balance);await ack();await settle();assert.equal((await state()).resources[6],balance-3000);
    const lessonSave=await nativeSave(row.name+'-completed-lesson',931);await page().close();
    await boot({...options,enabled:!row.enabled,save:[...lessonSave]});await settle();assert.equal((await state()).resources[6],balance-3000);lesson=true;
   }else{await settle();assert.equal((await state()).resources[6],balance);}
   const heroAction=await revealNativeAction(page(),'button[data-ui=heroes]',{mouse});await heroAction[press]();await wait(()=>goonkMobileState.mode==='hero'&&goonkMobileState.heroWindow);skills=(await state()).heroWindow.skills;
   const wisdom=skills.find(s=>/wisdom|sagesse/i.test(s.name));assert(wisdom,JSON.stringify(skills));assert.equal(/advanced|avanc|disciple/i.test(wisdom.mastery),row.edit===2&&!row.subtype1);
   await command(63);await settle();
  }else{
   for(let day=3;day<=8;day++){await advance(day,row.edit);await ack();await settle();}
   const before=(await state()).resources;await walk(1);const after=(await state()).resources;rewards=after.map((v,i)=>v-before[i]);
   if(row.kind==='wheel')assert.equal(rewards[6],row.weekly&&row.edit!==0?2000:1000);
  }
  report.scenarios.push({name:row.name,site:row.kind,subtype:row.subtype1?1:0,source36:row.enabled,source171:row.weekly,initial:row.initial,purchase:!!row.purchase,markerAfterPurchase:purchasedMarker,scriptEdit:row.edit,pendingNativeSaveReload:true,editSaveReload:true,reversedGlobalDefault:true,sharedSourceAndUI:true,blockedPurchaseRejected,universityLesson:lesson,completedLessonSaveReload:lesson,skills,rewards,legacyInput:legacy?930:null,saveVersion:931,viewport:page().viewportSize(),input:mouse?'mouse':'touch'});await page().close();
 }
 const baseline=report.scenarios.find(s=>s.name==='windmill-baseline'),upgraded=report.scenarios.find(s=>s.name==='windmill-custom');
 if(baseline&&upgraded){assert(baseline.rewards.some(v=>v>0));assert.deepEqual(upgraded.rewards,baseline.rewards.map(v=>v*2));report.windmillSourcePair={sameNativeSeed:1,baseline:baseline.rewards,upgraded:upgraded.rewards};}
}
