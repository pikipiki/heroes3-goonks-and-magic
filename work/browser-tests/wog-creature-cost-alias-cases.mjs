import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export function creatureCostAliasProgram({historical=false}={}){
 const p=compileErm(Buffer.from(`ZVSE
!#MA:${Array.from({length:8},(_,i)=>`C0/${i}/?v${8200+i}`).join(' ')};
${historical?'':'!#MA:F0/?v8208;'}
!#IF:M^COST INIT ${Array.from({length:8},(_,i)=>'%V'+(8200+i)).join('/')} ${historical?'OLD':'F%V8208'}^;
!?GE2;
!!MA:C0/7/?v8209;
${historical?'':'!!MA:F0/?v8210;'}
!!IF:M^COST NEXT %V8209 ${historical?'OLD':'F%V8210'}^;
`),{source:'Private native MA:C0..7 signed descriptor alias / MA:F read comparison'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runCreatureCostAlias({boot,state,command,wait,page,report,output,readCompletedNativeSave}){
 const historical=process.env.COST_ALIAS_OLD_CONTROL==='1',legacy=process.env.COST_ALIAS_LEGACY_SAVE;
 const rows=historical||legacy?[{name:'positive',fightValue:123456}]:[{name:'zero',fightValue:0},{name:'positive',fightValue:123456},{name:'sign-bit',fightValue:2147483648},{name:'all-bits',fightValue:4294967295}];
 const mouse=process.env.CASES.endsWith('-desktop'),press=mouse?'click':'tap';
 for(const row of rows.filter(r=>!process.env.COST_ALIAS_CASES||process.env.COST_ALIAS_CASES.split(',').includes(r.name))){
  const signed=row.fightValue|0,oldProgram=historical||!!legacy,scriptProgram=creatureCostAliasProgram({historical:oldProgram});
  fs.writeFileSync(path.join(output,row.name+'-program.json'),JSON.stringify(scriptProgram,null,2));
  const options={enabled:false,creatureCostFixture:row,scriptProgram,...(process.env.COST_ALIAS_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  const initial=`COST INIT 1/2/3/4/5/6/127/${oldProgram?37:signed} ${oldProgram?'OLD':'F'+signed}`;
  const read=text=>wait(text=>goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);
  const ack=async()=>{const s=await state(),old={text:s.dialogPresentation?.lines?.join(' '),id:s.dialogPresentation?.queryId};await page().locator('[data-dialog-confirm]')[press]();await wait(old=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==old.text||goonkMobileState.dialogPresentation?.queryId!==old.id,old);};
  const map=async()=>{for(let i=0;i<600;i++){const s=await state();if(s.mode==='map'&&s.turn)return;if(s.mode==='dialog'){assert(!s.dialogPresentation?.lines?.join(' ').startsWith('COST '));await ack();}await page().waitForTimeout(30);}throw Error('Creature cost map did not settle');};
  if(legacy){await boot({...options,save:[...fs.readFileSync(legacy)],expectedDialog:'source-campaign'});await read(initial);}
  else{
   await boot({...options,expectedDialog:'source-campaign'});await read(initial);
   const bytes=await readCompletedNativeSave(page(),command);assert.equal(bytes.readInt32LE(4),historical?931:932);fs.writeFileSync(path.join(output,row.name+'-pending.vsgm1'),bytes);await page().close();
   await boot({...options,save:[...bytes],expectedDialog:'source-campaign'});await read(initial);
  }
  await ack();await map();const independent=(await state()).armies.flatMap(a=>a.slots||[]).find(u=>u?.key==='core:pikeman');assert(independent);assert.equal(independent.fightValue,signed);assert.deepEqual(independent.cost,[1,2,3,4,5,6,127,37]);
  await command(3);const next=`COST NEXT ${historical?37:signed} ${oldProgram?'OLD':'F'+signed}`;await read(next);await ack();await map();
  const complete=await readCompletedNativeSave(page(),command);assert.equal(complete.readInt32LE(4),historical?931:932);fs.writeFileSync(path.join(output,row.name+'-complete.vsgm1'),complete);await page().close();
  await boot({...options,save:[...complete]});assert.equal((await state()).mode,'map');
  report.scenarios.push({...row,signedFightValue:signed,sourceC7:historical?37:signed,sourceF:oldProgram?null:signed,sourceResourceCosts:[1,2,3,4,5,6,127],independentNativeFightValue:independent.fightValue,independentNativeMithrilCost:37,pendingNativeSaveReload:true,completedNativeSaveReload:true,legacyInput:legacy?931:null,legacyStoredQueryPreserved:!!legacy,historicalEngineControl:historical,saveVersion:complete.readInt32LE(4),viewport:page().viewportSize(),input:mouse?'mouse':'touch'});await page().close();console.log('PASS native creature cost alias',row.name,historical?'old Mithril control':signed);
 }
}
