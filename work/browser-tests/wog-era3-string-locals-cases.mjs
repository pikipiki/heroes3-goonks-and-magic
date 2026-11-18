import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function stringLocalsFixture(){
 const source=`ZVSE2
!#VA(root:z);
!#VR(root):S^initializer^;
!?FU9440;
!#VA(items[3]:z) (idx:y);
!!IF:M^STR ENTRY [%(items)]^;
!!VR(items):S^alpha^;
!!VR(items[1]):S^beta^;
!!VR(items[2]):S^gamma^;
!!VR(idx):S1;
!!VR(items[idx]):+^+^;
!!IF:M^STR PARENT %(items)/%(items[1])/%(items[-1]) size %(items[SIZE]) addr %(@items)/%(@items[-1])/%(@items[idx])^;
!!FU9441:P;
!!IF:M^STR RETURN %(items)/%(items[1])/%(items[2]) global %Z100^;
!#VA(-items);
!#VA(reused[2]:z);
!!VR(reused):+^!^;
!!IF:M^STR REUSE %(reused)/%(reused[1]) addr %(@reused)^;
!!FU9442:P;
!!IF:M^STR EARLY %(reused)^;
!?FU9440;
!#VA(same:z);
!!IF:M^STR HANDLER %(same)^;
!?FU9441;
!#VA(child:z);
!!IF:M^STR CHILD ENTRY [%(child)]^;
!!VR(child):S^child^;
!!VRz100:S^persisted^;
!!IF:M^STR CHILD %(child)^;
!!FU9443:P;
!!IF:M^STR EMPTY %(child)^;
!?FU9442;
!#VA(local:z);
!!VR(local):S^discarded^;
!!FU:E;
!!IF:M^UNREACHABLE^;
!#FU9440:P;
!#IF:M^STR INIT %Z-1 global %Z100^;`;
 const p=compileErm(Buffer.from(source),{source:'Private ERA3 local string scope probe'});
 p.originalMessages=['ZVSE private native companion town continuation'];return p;
}

export async function runStringLocals({boot,state,wait,page,report,output,save}){
 const scriptProgram=stringLocalsFixture();fs.writeFileSync(path.join(output,'string-locals-program.json'),JSON.stringify(scriptProgram,null,2));
 if(process.env.QUICK_OLD_READER_SAVE){
  const {runQuickScope}=await import('./wog-era3-quick-scope-cases.mjs');
  await runQuickScope({boot:options=>boot({...options,scriptProgram}),state,wait,page,report,output,save});return;
 }
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const read=async text=>{await wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);assert.equal((await state()).dialogPresentation.lines.join(' '),text);};
 const ack=async()=>{const old=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await wait(old=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==old,old);};
 const seen=[];
 const check=async text=>{await read(text);seen.push(text);await ack();};
 await boot({...options,expectedDialog:'source-campaign'});
 await check('STR ENTRY []');
 await check('STR PARENT alpha/beta+/gamma size -1 addr -3/-1/-2');
 await check('STR CHILD ENTRY []');
 await read('STR CHILD child');
 const pending=await save();fs.writeFileSync(path.join(output,'string-locals-pending.vsgm1'),pending);
 await page().close();await boot({...options,save:[...pending],expectedDialog:'source-campaign'});
 await check('STR CHILD child');
 for(const text of ['STR EMPTY child','STR RETURN alpha/beta+/gamma global persisted','STR REUSE beta+!/gamma addr -2','STR EARLY beta+!','STR HANDLER gamma','STR INIT initializer global persisted'])await check(text);
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const complete=await save();fs.writeFileSync(path.join(output,'string-locals-complete.vsgm1'),complete);
 await page().close();await boot({...options,save:[...complete]});assert.equal((await state()).mode,'map');
 report.scenarios.push({kind:'era3-string-locals',seen,nestedNativeSaveReload:true,completedNativeSaveReload:true,negativeBankArrayAddresses:true,sourceNegativePoolSizeQuirk:true,dynamicWrite:true,reusedContentsRetained:true,earlyExitRestoresCaller:true,matchingHandlersShareBank:true,initializationBankRestored:true,programSha256:scriptProgram.sha256,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
 await page().close();
}
