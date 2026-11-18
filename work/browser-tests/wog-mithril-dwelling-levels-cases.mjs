import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function mithrilDwellingLevelsFixture(){
 const rows=Array.from({length:6},(_,i)=>`!!DW${10+i*3}/11/0:M0/?v810/?v811;\n!!IF:M^DLEVEL ${i} %V810/%V811^;`).join('\n');
 const p=compileErm(Buffer.from('!?OB17;\n'+rows),{source:'Private source mithril dwelling stock queries'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}

export async function runMithrilDwellingLevels({boot,state,command,wait,walk,panel,buy,page,output,report,readCompletedNativeSave}){
 const desktop=process.env.CASES==='dwelling-levels-desktop',portrait=process.env.MITHRIL_LEVELS_PORTRAIT==='1',oldControl=process.env.MITHRIL_LEVELS_OLD_CONTROL==='1';
 const scriptProgram=mithrilDwellingLevelsFixture();fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:true,dwellingLevelFixture:true,scriptProgram,...(portrait?{viewport:{width:390,height:844}}:{})};
 await boot(process.env.MITHRIL_LEVELS_LEGACY_SAVE?{...options,enabled:false,save:[...fs.readFileSync(process.env.MITHRIL_LEVELS_LEGACY_SAVE)]}:options);
 const first=await panel(),costs=Array.from({length:6},(_,i)=>first.offers.find(row=>row.id===i+3&&row.kind===1)?.cost??null);
 fs.writeFileSync(path.join(output,'initial-offers.json'),JSON.stringify(first,null,2));
 assert.deepEqual(costs,oldControl?[1,2,3,2,2,2]:[1,1,2,null,1,2]);
 const closePanel=async()=>{if(await page().locator('.mithril-panel').isVisible())await page().locator('[data-mithril-close]')[desktop?'click':'tap']();};
 await closePanel();
 if(oldControl){
  const bytes=await readCompletedNativeSave(page(),command,{tag:834});fs.writeFileSync(path.join(output,'legacy-dwelling-prices.vsgm1'),bytes);
  report.scenarios.push({oldPublishedControl:true,costs,nativeSaveVersion:bytes.readInt32LE(4),swordsmanIncorrectlyEligible:true});await page().close();return;
 }
 const listen=()=>page().evaluate(()=>{window.privateMithrilLevels=[];window.addEventListener('goonk-state',e=>{const t=e.detail.dialogPresentation?.lines?.find(t=>t.startsWith('DLEVEL '));if(t&&window.privateMithrilLevels.at(-1)!==t)window.privateMithrilLevels.push(t);});});
 const rows=async()=>{
  const messages=await page().evaluate(()=>window.privateMithrilLevels.slice(-6));assert.equal(messages.length,6);
  return messages.map((text,index)=>{const m=text.match(/^DLEVEL (\d+) (\d+)\/(\d+)$/);assert(m,text);assert.equal(Number(m[1]),index);return [Number(m[2]),Number(m[3])];});
 };
 const closeRecruit=async()=>{if((await state()).mode==='recruit')await page().locator('[data-ui=cancel-recruit]:visible').first()[desktop?'click':'tap']();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);};
 await listen();await walk(5,0);const initial=await rows();assert.deepEqual(initial.map(r=>r[0]),[0,90,10,6,62,64]);await closeRecruit();
 const purchases=[];let remaining=first.amount;
 for(const[index,expectedCost]of [[0,1],[1,1],[2,2],[4,1],[4,2],[5,2]]){
  const offer=(await panel()).offers.find(row=>row.id===index+3&&row.kind===1);assert(offer);assert.equal(offer.cost,expectedCost);
  await buy(offer);remaining-=expectedCost;assert.equal((await state()).mithril.amount,remaining);
  purchases.push({index,cost:expectedCost,remaining});
 }
 assert.equal(remaining,first.amount-9);await closePanel();
 const bytes=await readCompletedNativeSave(page(),command,{tag:835});fs.writeFileSync(path.join(output,'source-dwelling-prices.vsgm1'),bytes);
 await page().close();await boot({...options,enabled:false,save:[...bytes]});await listen();
 assert.equal((await panel()).amount,remaining);await closePanel();
 await walk(-1,0);await walk(1,0);const restored=await rows();await closeRecruit();
 assert.deepEqual(restored.map(r=>r[0]),[1,91,11,6,91,65]);
 assert.deepEqual(restored.map(r=>r[1]),initial.map(r=>r[1]),'Every purchase preserves the existing stock, including the two-step upgrade');
 await page().screenshot({path:path.join(output,'source-dwellings-restored.png')});
 report.scenarios.push({costs,initial,restored,purchases,initialMithril:first.amount,restoredMithril:remaining,nativeSaveVersion:bytes.readInt32LE(4),nativeSaveReload:true,reversedGlobalDefault:true,swordsmanSourceLevelMismatchBlocked:true,alreadyUpgradedSourceCostDoubled:true,legacyEighteenOrNineteenChoiceSave:!!process.env.MITHRIL_LEVELS_LEGACY_SAVE,viewport:page().viewportSize(),input:desktop?'mouse':'touch'});
 await page().close();await boot({...options,enabled:false});assert.equal(await page().locator('[data-mithril-open]').isVisible(),false);report.scenarios.push({disabledFreshGame:true,noSavedActivationLeak:true});await page().close();
}
