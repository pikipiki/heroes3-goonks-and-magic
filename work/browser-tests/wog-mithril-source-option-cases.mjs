import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export function mithrilSourceOptionFixture({deferInitialRead=false}={}){
 const query=(prefix,step)=>`${prefix}VRv7317:S-88;\n${prefix}VRv7336:S-77;\n${prefix}UN:P17/?v7317;\n${prefix}UN:P36/?v7336;\n${prefix}IF:M^OPTION36 ${step} %V7317/%V7336^;`;
 const p=compileErm(Buffer.from((deferInitialRead?'!#UN:P17/?v7317;':query('!#',1))+'\n!?GE2;\n'+query('!!',2)),{
  source:'Private native Mithril source option query',dialect:'era3',
 });
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runMithrilSourceOption({boot,panel,buy,state,command,wait,page,output,report,readCompletedNativeSave}){
 const scriptProgram=mithrilSourceOptionFixture({deferInitialRead:process.env.CASES==='source-option-control'});fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const desktop=process.env.CASES==='source-option-desktop';
 const availability=async active=>{
  const current=await state(),accessible=active||!!current.mithrilDisplayEnabled;
  assert.equal(!!current.mithrilEnabled,active,'Source36 controls purchases independently of information');
  await page().waitForFunction(accessible=>{const button=document.querySelector('button[data-mithril-open]');return button&&button.hidden===!accessible;},accessible);
  assert.equal(await page().locator('button[data-mithril-open]').evaluate(button=>!button.hidden),accessible,'Information remains accessible when149 is active');
  if(!active&&accessible){
   const information=await panel();assert.equal(information.offers?.length||0,0);
   assert.equal(await page().locator('[data-mithril-buy]').count(),0,'Information alone cannot offer purchases');
   await page().locator('[data-mithril-close]')[desktop?'click':'tap']();
  }
 };
 const ack=async()=>{const button=page().locator('[data-dialog-confirm]');if(await button.count())await button[desktop?'click':'tap']();else await command(1);};
 const query=async(step,active)=>{
  await wait(step=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>line.includes('OPTION36 '+step)),step);
  const text=(await state()).dialogPresentation.lines.join(' ');assert(text.includes(`OPTION36 ${step} 0/${active?1:0}`),text);return text;
 };
 const inspect=async active=>{
  await availability(active);
  assert.equal((await state()).resources[7],active?93:100,'Source reads never spend mithril');
  return active?await panel():null;
 };
 if(process.env.CASES==='source-option-control'){
  await boot({enabled:true,wogChoice:1,scriptProgram});
  await availability(true);
  const data=await panel(),mine=data.offers.find(row=>row.kind===0&&row.cost===7);assert(mine);
  await buy(mine);assert.equal((await state()).resources[7],93);
  await page().locator('[data-mithril-close]').tap();await command(3);
  await wait(()=>{try{return /Original campaign cave-gerfrex[^\n]*unvalidated original WoG option access/.test(Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));}catch{return false;}});
  const log=await page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
  const match=log.match(/Original campaign cave-gerfrex[^\n]*unvalidated original WoG option access/);
  assert(match,'Old native host must reject the source read');const error=match[0];
  report.scenarios.push({scope:'Old engine control: source UN:P36 is rejected after a real native Mithril purchase',unsupportedSourceRead:true,sourceProgramStopped:true,error,nativeEnabled:true,nativePurchase:true,cost:7});
  await page().close();
  const expectedPageErrors=report.errors.splice(0);assert(expectedPageErrors.every(error=>['ErrorEvent','Exception'].includes(error)),JSON.stringify(expectedPageErrors));
  report.scenarios.at(-1).expectedPageErrors=expectedPageErrors;return;
 }
 const matrix=desktop?[[false,1,true],[true,0,false]]:process.env.MITHRIL_SOURCE_PORTRAIT==='1'?[[true,-1,true],[false,-1,false]]:
  [[false,-1,false],[true,-1,true],[false,1,true],[true,0,false],[false,0,false],[true,1,true]];
 for(const [enabled,wogChoice,active]of matrix){
  const options={enabled,wogChoice,scriptProgram,...(process.env.MITHRIL_SOURCE_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  await boot({...options,expectedDialog:'source-campaign'});const initial=await query(1,active);await ack();
  await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  assert.equal((await state()).resources[7],100);
  await availability(active);
  let mine;
  if(active){const data=await panel();mine=data.offers.find(row=>row.kind===0&&row.cost===7);assert(mine);await buy(mine);assert.equal((await state()).resources[7],93);}
  const bytes=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,`source-option-${enabled}-${wogChoice}.vsgm1`),bytes);
  await page().close();await boot({...options,enabled:!enabled,save:[...bytes]});
  const loaded=await inspect(active);if(active)assert(loaded.offers.find(row=>row.id===mine.id)?.active,'Real purchased mine survives default reversal');
  if(active)await page().locator('[data-mithril-close]')[desktop?'click':'tap']();
  await command(3);const next=await query(2,active);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  await inspect(active);
  report.scenarios.push({globalModule:enabled,choice:wogChoice,active,initial,next,purchase:active,cost:active?7:0,nativePotionOption17:0,saveReload:true,reversedGlobalDefault:true,viewport:page().viewportSize(),input:desktop?'mouse':'touch'});
  await page().close();
 }
}
