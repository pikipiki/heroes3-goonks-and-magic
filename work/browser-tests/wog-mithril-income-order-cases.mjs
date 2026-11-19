import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export async function runIncomeOrder({boot,panel,state,command,wait,page,output,report,readCompletedNativeSave}){
 const mouse=process.env.CASES.endsWith('-desktop'),press=mouse?'click':'tap';
 const saveVersion=Number(process.env.GOONK_EXPECTED_SAVE_VERSION||931);
 const rows=[100,85,70].flatMap(percent=>[false,true].map(enabled=>({name:`${percent}-${enabled?'mithril':'baseline'}`,percent,enabled,goose:false})));
 rows.push({name:'85-goose',percent:85,enabled:true,goose:true});
 for(const row of rows.filter(r=>!process.env.INCOME_CASES||process.env.INCOME_CASES.split(',').includes(r.name))){
  const program=compileErm(Buffer.from(`ZVSE
!#PO12/11/0:N15;
!#PO13/11/0:N15;
!#IF:M^INCOME READY^;
!?GE2;
!!IF:M^INCOME DAY 2^;
!?GE3;
!!IF:M^INCOME DAY 3^;
`),{source:'Private two owned gem mines, aggregate handicap and raw Goose income'});
  program.originalMessages=['ZVSE private native mithril option query'];
  fs.writeFileSync(path.join(output,row.name+'-program.json'),JSON.stringify(program,null,2));
  const options={incomeFixture:true,incomeGoose:row.goose,incomePercent:row.percent,enabled:row.enabled,wogChoice:row.enabled?1:0,scriptProgram:program,...(process.env.INCOME_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  const read=text=>wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);
  const ack=async()=>{const s=await state(),before={text:s.dialogPresentation?.lines?.join(' '),id:s.dialogPresentation?.queryId};await page().locator('[data-dialog-confirm]')[press]();await wait(before=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==before.id||goonkMobileState.dialogPresentation?.lines?.join(' ')!==before.text,before);};
  const settle=async()=>{for(let i=0;i<600;i++){const s=await state();if(s.mode==='map'&&s.turn)return;if(s.mode==='dialog'){assert(!s.dialogPresentation?.lines?.join(' ').startsWith('INCOME '));await ack();}await page().waitForTimeout(50);}throw Error('Income map did not settle');};
  const legacySave=process.env.INCOME_LEGACY_SAVE;
  let before,checkpoint;
  if(legacySave){
   await boot({...options,enabled:!row.enabled,save:[...fs.readFileSync(legacySave)],expectedDialog:'source-campaign'});await read('INCOME DAY 2');before=await state();
  }else{
   await boot({...options,expectedDialog:'source-campaign'});await read('INCOME READY');await ack();await settle();before=await state();
   if(row.enabled&&process.env.INCOME_OLD_CONTROL!=='1'){const data=await panel();for(const x of [12,13]){const offer=data.offers.find(o=>o.kind===0&&o.x===x&&o.y===11);assert.equal(offer.dailyIncome,2,'Mine information shows raw production before aggregate handicap');assert.equal(offer.incomePercent,row.percent);}if(row.percent!==100)assert.match(await page().locator('.mithril-panel').innerText(),/Before income handicap|Avant handicap de revenus/);await page().screenshot({path:path.join(output,row.name+'-production.png')});await page().locator('[data-mithril-close]')[press]();}
   await command(3);await read('INCOME DAY 2');checkpoint=await state();
   const save=await readCompletedNativeSave(page(),command);assert.equal(save.readInt32LE(4),saveVersion);fs.writeFileSync(path.join(output,row.name+'-pending.vsgm1'),save);await page().close();
   await boot({...options,enabled:!row.enabled,save:[...save],expectedDialog:'source-campaign'});await read('INCOME DAY 2');
  }
  const gem=before.resourceTypes.findIndex(t=>t.key==='gems');assert(gem>=0);
  await ack();await settle();
  const second=await state(),delta=second.resources.map((n,i)=>n-before.resources[i]);
  const expected=process.env.INCOME_OLD_CONTROL==='1'?Number(process.env.INCOME_OLD_EXPECT||4):Math.trunc((row.enabled?4:2)*row.percent/100);
  assert.equal(delta[gem],legacySave?0:expected,legacySave?'Already paid income is not replayed':'Two raw mine amounts aggregate, then truncate once');
  if(checkpoint)assert.deepEqual(second.resources,checkpoint.resources,'Source checkpoint follows income; reload does not pay it again');
  if(process.env.INCOME_OLD_CONTROL==='1')assert.equal(delta[6],425,'Historical native handicap85% is actually active on500 town gold');
  await command(3);await read('INCOME DAY 3');await ack();await settle();
  const third=await state(),next=third.resources.map((n,i)=>n-second.resources[i]);assert.equal(next[gem],expected);
  assert.equal(next[6],legacySave?425:delta[6],'Daily raw/ordinary gold persists after pending native save');
  const result={...row,legacyInput:legacySave?931:null,historicalEngineControl:process.env.INCOME_OLD_CONTROL==='1',handicapSetupInput:legacySave?'saved historical native field':process.env.INCOME_OLD_CONTROL==='1'?'historical native keyboard field':mouse?'mouse':'touch',expectedGems:expected,gems:delta[gem],nextDayGems:next[gem],gold:delta[6],nextDayGold:next[6],checkpointPhase:'after-income',mineInformationChecked:row.enabled&&!legacySave&&process.env.INCOME_OLD_CONTROL!=='1',deltas:[delta,next],pendingIncomeSaveReload:true,reversedGlobalDefault:true,saveVersion,viewport:page().viewportSize(),input:mouse?'mouse':'touch'};
  report.scenarios.push(result);await page().screenshot({path:path.join(output,row.name+'.png')});await page().close();console.log('PASS aggregate income',row.name,JSON.stringify(result));
 }
 const baseline=report.scenarios.find(r=>r.name==='100-baseline');
 if(baseline)for(const row of report.scenarios)assert.equal(row.gold,Math.trunc(baseline.gold*row.percent/100)+(row.goose?7000:0),'Town/hero ordinary gold is taxed; raw Goose grant is not');
 const plain=report.scenarios.find(r=>r.name==='85-mithril'),goose=report.scenarios.find(r=>r.name==='85-goose');
 if(plain&&goose)assert.equal(goose.gold-plain.gold,7000);
}
