import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runIncomeAi({boot,state,command,wait,page,report,output}){
 for(const goose of [false,true]){
  const program=compileErm(Buffer.from(`ZVSE
!#IF:M^AI READY^;
!?GE2;
!!OW:R1/6/?v20;
!!OW:R1/7/?v21;
!!IF:M^AI INCOME 2 %V20/%V21^;
!?GE3;
!!OW:R1/6/?v20;
!!OW:R1/7/?v21;
!!IF:M^AI INCOME 3 %V20/%V21^;
`),{source:'Private ordinary income modifiers and raw Goose/Mithril AI grants'});
  program.originalMessages=['ZVSE private native mithril option query'];
  fs.writeFileSync(path.join(output,`${goose?'goose':'plain'}-program.json`),JSON.stringify(program,null,2));
  await boot({incomeFixture:true,incomeAiFixture:true,incomeAiGoose:goose,incomeAiPercent:85,aiFunds:100,enabled:true,wogChoice:1,scriptProgram:program,expectedDialog:'source-campaign'});
  const line=()=>state().then(s=>s.dialogPresentation?.lines?.join(' '));
  const ack=async()=>{const old=await line();await page().locator('[data-dialog-confirm]').tap();await wait(old=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==old,old);};
  const settle=async()=>{for(let i=0;i<600;i++){const s=await state();if(s.mode==='map'&&s.turn)return;if(s.mode==='dialog')await ack();await page().waitForTimeout(30);}throw Error('AI income turn stalled');};
  assert.equal(await line(),'AI READY');await ack();await settle();
  const snapshots=[];
  for(const day of [2,3]){
   await command(3);await wait(day=>goonkMobileState.dialogPresentation?.lines?.join(' ').startsWith('AI INCOME '+day+' '),day);
   const message=await line(),match=message.match(/^AI INCOME (\d+) (\d+)\/(\d+)$/);assert(match,message);assert.equal(Number(match[3]),100);snapshots.push(Number(match[2]));await ack();await settle();
  }
  // Native AI bonus700% per week adds exactly one daily base amount. Blue's
  // gold mine1000 + village hall500 becomes3000 regular, then85%=2550.
  const expected=2550+10000+(goose?7000:0),observed=snapshots[1]-snapshots[0];
  assert.equal(observed,expected,'Raw ERM grants bypass AI bonus and income handicap');
  report.scenarios.push({goose,ai:'EmptyAI (private no-spending control)',incomePercent:85,weeklyGoldBonusPercent:700,ordinaryGold:1500,modifiedOrdinaryGold:2550,mithrilBars:100,rawMithrilGold:10000,rawGooseGold:goose?7000:0,snapshots,observed,expected,input:'touch'});
  await page().close();console.log('PASS AI raw income',goose,observed);
 }
}
