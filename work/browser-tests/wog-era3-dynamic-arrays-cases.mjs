import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function dynamicArraysFixture(){
 const source=`ZVSE2
!?FU9430;
!#VA(args[3]:x) (items[3]:y) (idx:y) (i:y);
!!VR(items):C10/20/30;
!!VR(idx):S1;
!!VR(i):S0;
!!VRi:S2;
!!VRj:S1;
!!VR(items[idx]):+(items[i]);
!!VR(args[j]):S81;
!!VRv990:S(items[idx]);
!!VRv991:S(args[j]);
!!IF:M^DYNAMIC ENTRY %V990/%V991 addr %(@items[idx])/%(@args[j]) quick %(i)^;
!!FU9431:P?(idx)/?(items[idx]);
!!VRv992:Si;
!!VRv993:S(items[i]);
!!VRj:S-1;
!!VRv994:S(@items[j]);
!!VRj:S3;
!!VRv995:S(@items[j]);
!!IF:M^DYNAMIC RETURN %(idx) items %(items[0])/%(items[1])/%(items[2]) args %(args[0])/%(args[1])/%(args[2]) quick %V992 read %V993 invalid %V994/%V995^;
!?FU9431;
!#VA(index:x) (element:x);
!!VR(index):S0;
!!VR(element):S99;
!!VRi:S0;
!!IF:M^DYNAMIC NESTED %(index)/%(element)^;
!#FU9430:P7/8/9;`;
 const p=compileErm(Buffer.from(source),{source:'Private ERA3 receiver dynamic local-array probe'});
 p.originalMessages=['ZVSE private native companion town continuation'];return p;
}

export async function runDynamicArrays({boot,state,wait,page,report,output,save}){
 const scriptProgram=dynamicArraysFixture();fs.writeFileSync(path.join(output,'dynamic-arrays-program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const read=async text=>{await wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);return(await state()).dialogPresentation.lines.join(' ');};
 const ack=async()=>{const old=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await wait(old=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==old,old);};
 const check=async text=>{const result=await read(text);await ack();return result;};
 await boot({...options,expectedDialog:'source-campaign'});
 const entry=await check('DYNAMIC ENTRY 50/81 addr 2/2 quick 0');
 const nested='DYNAMIC NESTED 0/99';await read(nested);
 const pending=await save();fs.writeFileSync(path.join(output,'dynamic-arrays-pending.vsgm1'),pending);
 await page().close();await boot({...options,save:[...pending],expectedDialog:'source-campaign'});await read(nested);await ack();
 const returned=await check('DYNAMIC RETURN 0 items 10/99/30 args 7/81/9 quick 2 read 30 invalid 0/0');
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const bytes=await save();fs.writeFileSync(path.join(output,'dynamic-arrays-complete.vsgm1'),bytes);
 await page().close();await boot({...options,save:[...bytes]});assert.equal((await state()).mode,'map');
 report.scenarios.push({kind:'era3-dynamic-local-arrays',entry,nested,returned,nestedNativeSaveReload:true,completedNativeSaveReload:true,capturedOutputIndexBeforeEarlierCopyOut:true,quickIndexRestoredAfterCall:true,outOfBoundsAddressOnly:true,programSha256:scriptProgram.sha256,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
 await page().close();
}
