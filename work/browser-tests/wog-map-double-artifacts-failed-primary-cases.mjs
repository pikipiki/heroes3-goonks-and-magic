import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export async function runFailedPrimary({boot,sheet,state,wait,approachEnemy,page,report,output,save}){
 const source=`ZVSE
!#HE0:A2/7/?v98/?v99;
!#HE0&v98>0:A3/7/v98/1;
!#VRv50:S0;
!#IF:M^DART FAILURE READY^;
!$OB5;
!!VRv50:+1;
!!PO998:N?v20;
!!HE0:A2/7/?v21/?v22;
!!IF:M^DART FAILURE POST %V50/%V20/%V21/%V22^;
!!HE0&v50=1:A3/37/1/0;
!!IF:M^DART FAILURE CONTINUE %V50^;`;
 const scriptProgram=compileErm(Buffer.from(source),{source:'Private source119 failed primary and retry'});
 scriptProgram.originalMessages=['ZVSE private native companion town continuation'];
 fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,artifactFixture:{existing:'blocked-full',backpackCap:64},doubleArtifactChoice:1,doubleArtifactsConfigured:false};
 const read=text=>wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);
 const ack=async()=>{const s=await state(),before={text:s.dialogPresentation.lines.join(' '),query:s.dialogPresentation.queryId};await page().locator('[data-dialog-confirm]').tap();await wait(before=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.queryId!==before.query||goonkMobileState.dialogPresentation?.lines?.join(' ')!==before.text,before);};
 const reach=async expected=>{for(let i=0;i<400;i++){const s=await state(),text=s.dialogPresentation?.lines?.join(' ');if(text===expected)return;if(s.mode==='dialog'){assert(!text?.startsWith('DART FAILURE POST '),text);await ack();}await page().waitForTimeout(50);}throw Error('Missing '+expected);};
 await boot({...options,expectedDialog:'source-campaign'});await read('DART FAILURE READY');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 await approachEnemy(2);const first='DART FAILURE POST 1/0/0/0';await reach(first);
 const bytes=await save();assert.equal(bytes.readInt32LE(4),929);fs.writeFileSync(path.join(output,'failed-primary-pending.vsgm1'),bytes);await page().close();
 await boot({...options,doubleArtifactsConfigured:true,save:[...bytes],expectedDialog:'source-campaign'});await read(first);await ack();await read('DART FAILURE CONTINUE 1');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 await approachEnemy(1);await reach('DART FAILURE POST 2/0/1/0');await ack();await read('DART FAILURE CONTINUE 2');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const hero=await sheet();assert.equal([...(hero.slots||[]),...(hero.backpack||[])].filter(a=>a.name&&a.icon===7).length,1);assert.equal(hero.backpack.filter(a=>a.name).length,64);
 fs.writeFileSync(path.join(output,'hero.json'),JSON.stringify(hero,null,2));report.scenarios.push({kind:'failed-primary-artifact',privateBackpackCapacity:64,occupiedWeaponSlot:true,first:{marker:0,copies:0,groundObjects:1},retry:{marker:0,copies:1,groundObjects:0},pendingNativeSaveReload:true,independentInventoryCheck:true});await page().close();
}
