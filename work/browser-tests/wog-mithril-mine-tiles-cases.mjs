import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function mineTilesProgram(row,{legacy=false}={}){
 const read=prefix=>`${prefix}PO12/11/0:N?v20;\n${prefix}PO14/11/0:N?v21;\n${prefix}PO15/11/0:N?v22;`;
 const source=`ZVSE
${legacy?'':`!#PO12/11/0:N${row.initial};\n!#PO14/11/0:N${row.foreign??0};\n!#PO15/11/0:N${row.foreign??0};`}
!#IF:M^MINE READY^;
${Array.from({length:14},(_,i)=>{const day=i+2;return `!?GE${day};\n${read('!!')}\n!!IF:M^MINE DAY ${day} %V20/%V21/%V22^;`+(day===2?`\n!!PO12/11/0:N${row.setAt2};\n${read('!!')}\n!!IF:M^MINE EDIT %V20/%V21/%V22^;`:'');}).join('\n')}`;
 const p=compileErm(Buffer.from(source),{source:'Private native source42/77 shared mine tile markers'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runMineTiles({boot,panel,buy,state,command,wait,page,output,report,readCompletedNativeSave}){
 const press=process.env.CASES.endsWith('-desktop')?'click':'tap';
 const saveVersion=Number(process.env.GOONK_EXPECTED_SAVE_VERSION||930);
 const legacySave=process.env.MINE_TILES_LEGACY_SAVE,producer=process.env.MINE_TILES_LEGACY_PRODUCER==='1';
 const rows=legacySave||producer?[{name:'legacy-purchase',initial:0,purchase:true,weekly:process.env.MINE_TILES_LEGACY_WEEKLY==='1',setAt2:0,enabled:true}]:[
  {name:'daily-purchase',initial:0,purchase:true,weekly:false,setAt2:1,enabled:true},
  {name:'daily-script-clear',initial:7,weekly:false,setAt2:0,enabled:true},
  {name:'weekly-purchase-custom',initial:0,purchase:true,weekly:true,setAt2:3,enabled:true,foreign:15},
  {name:'weekly-script-marker',initial:15,weekly:true,setAt2:15,enabled:true,foreign:7},
  {name:'disabled-script-marker',initial:5,weekly:true,setAt2:5,enabled:false,foreign:5},
 ];
 for(const row of rows.filter(r=>!process.env.MINE_TILES_CASES||process.env.MINE_TILES_CASES.split(',').includes(r.name))){
  const scriptProgram=mineTilesProgram(row,{legacy:!!legacySave||producer});fs.writeFileSync(path.join(output,row.name+'-program.json'),JSON.stringify(scriptProgram,null,2));
  let initialResource;
  const options={enabled:row.enabled,wogChoice:row.enabled?1:0,weeklyMines:row.weekly,scriptProgram,mineTilesFixture:true,...(process.env.MINE_TILES_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  const read=text=>wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);
  const ack=async()=>{const s=await state(),before={text:s.dialogPresentation?.lines?.join(' '),query:s.dialogPresentation?.queryId};await page().locator('[data-dialog-confirm]')[press]();await wait(before=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==before.query||goonkMobileState.dialogPresentation?.lines?.join(' ')!==before.text,before);};
  const map=async()=>{for(let i=0;i<600;i++){const s=await state();if(s.mode==='map'&&s.turn)return;if(s.mode==='dialog'){const text=s.dialogPresentation?.lines?.join(' ')||'';assert(!text.startsWith('MINE '),'Unexpected source checkpoint '+text);await ack();}await page().waitForTimeout(50);}throw Error('Map did not settle after ordinary game messages');};
  const closePanel=async()=>{if(await page().locator('.mithril-panel').isVisible())await page().locator('[data-mithril-close]')[press]();};
  const advance=async(day,marker,foreign)=>{
   await closePanel();await command(3);const expected=`MINE DAY ${day} ${marker}/${foreign}/${foreign}`;
   for(let i=0;i<600;i++){const s=await state(),text=s.dialogPresentation?.lines?.join(' ');if(text===expected)return;if(s.mode==='dialog'){assert(!text?.startsWith('MINE DAY '),text);await ack();}await page().waitForTimeout(50);}throw Error('Missing '+expected);
  };
  const offer=async()=>{const data=await panel();const neutral=data.offers.find(r=>r.kind===0&&r.x===15&&r.y===11);if(neutral){assert.equal(neutral.available,false);assert(!('dailyIncome'in neutral));}return data.offers.find(r=>r.kind===0&&r.x===12&&r.y===11);};
  if(legacySave){await boot({...options,enabled:false,save:[...fs.readFileSync(legacySave)]});await map();const old=await offer();assert(old.active);assert.equal(old.days,7);}
  else{
   await boot({...options,expectedDialog:'source-campaign'});await read('MINE READY');await ack();await map();
   if(row.enabled){const current=await offer();assert(current);initialResource=current.resource;assert.equal(current.active,!!row.initial);if(row.initial&&!row.weekly)assert.equal(current.days,row.initial);}
   else assert.equal((await state()).mithrilEnabled,false);
   if(row.purchase){const current=await offer();assert.equal(current.cost,row.weekly?5:7);await buy(current);assert.equal((await offer()).days,7);}
  }
  if(producer){const bytes=await readCompletedNativeSave(page(),command);assert.equal(bytes.readInt32LE(4),929);fs.writeFileSync(path.join(output,'legacy-mine.vsgm1'),bytes);report.scenarios.push({kind:'legacy-mine-producer',saveVersion:929,physicalPurchase:true,days:7});await page().close();continue;}
  const foreign=row.foreign??0,day2=row.weekly?row.initial||(row.purchase?7:0):row.purchase?6:Math.max(0,row.initial-1);
  await advance(2,day2,foreign);
  const bytes=await readCompletedNativeSave(page(),command);assert.equal(bytes.readInt32LE(4),saveVersion);fs.writeFileSync(path.join(output,row.name+'-pending.vsgm1'),bytes);await page().close();
  await boot({...options,enabled:!row.enabled,save:[...bytes],expectedDialog:'source-campaign'});await read(`MINE DAY 2 ${day2}/${foreign}/${foreign}`);await ack();await read(`MINE EDIT ${row.setAt2}/${foreign}/${foreign}`);await ack();await map();
  if(row.enabled){const current=await offer();assert.equal(current.active,row.setAt2!==0);if(!row.weekly)assert.equal(current.days,row.setAt2);}
  else assert.equal((await state()).mithrilEnabled,false);
  const daily=[];
  for(let day=3;day<=(row.weekly?8:3);day++){
   const marker=row.enabled?(row.weekly?(day===8?0:row.setAt2):Math.max(0,row.setAt2-(day-2))):row.setAt2;
   const other=row.enabled&&row.weekly&&day===8?0:foreign;
   await advance(day,marker,other);daily.push({day,marker,foreign:other,resources:(await state()).resources});await ack();await map();
  }
  if(row.enabled){const current=await offer();assert.equal(current.active,false);assert(current.available);if(row.weekly&&row.setAt2)assert.equal(current.resource,initialResource);}
  report.scenarios.push({name:row.name,weekly:row.weekly,enabled:row.enabled,physicalPurchase:!!row.purchase,initial:row.initial,day2Marker:day2,scriptEdit:row.setAt2,foreignMarkers:foreign,pendingNativeSaveReload:true,reversedGlobalDefault:true,sharedSourceAndUI:true,protectedResourcePreserved:row.weekly&&row.enabled&&!!row.setAt2,daily,legacyInput:legacySave?929:null,saveVersion,viewport:page().viewportSize(),input:press==='click'?'mouse':'touch'});await page().close();
 }
}
