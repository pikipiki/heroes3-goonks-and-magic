import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export async function runDoubleArtifactsCompatibility({boot,sheet,state,command,wait,approachEnemy,page,report,output,save}){
 const source=`ZVSE
!#HE0:A2/7/?v98/?v99;
!#HE0&v98>0:A3/7/v98/1;
!#IF:M^DART LEGACY PENDING^;
!#UN:P119/?v10;
!#IF:M^DART LEGACY READY %V10^;
!$OB5;
!!PO998:N?v20;
!!HE0:A2/7/?v21/?v22;
!!IF:M^DART LEGACY POST %V20/%V21/%V22^;
!!UN:P119/?v23;
!!IF:M^DART LEGACY RESTORED %V23^;`;
 const scriptProgram=compileErm(Buffer.from(source),{source:'Private old-save-compatible source119 baseline'});
 scriptProgram.originalMessages=['ZVSE private native companion town continuation'];
 fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const existing=process.env.DOUBLE_ARTIFACTS_LEGACY_SAVE;
 const options={enabled:false,scriptTown:true,artifactFixture:{existing:'none'},scriptProgram,doubleArtifactChoice:existing?1:null,doubleArtifactsConfigured:!!existing};
 const read=text=>wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);
 const ack=async()=>{const text=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]').tap();await wait(text=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==text,text);};
 await boot({...options,...(existing?{save:[...fs.readFileSync(existing)]}:{}),expectedDialog:'source-campaign'});await read('DART LEGACY PENDING');
 if(!existing){
  const bytes=await save();assert.equal(bytes.readInt32LE(4),928);fs.writeFileSync(path.join(output,'legacy-artifact.vsgm1'),bytes);
  report.scenarios.push({kind:'double-artifact-legacy-producer',saveVersion:928,pendingBeforeFutureOptionRead:true});await page().close();return;
 }
 await ack();await read('DART LEGACY READY 0');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 await approachEnemy(2);
 for(let tick=0;tick<300;tick++){
  const s=await state(),text=s.dialogPresentation?.lines?.join(' ');
  if(text==='DART LEGACY POST 0/1/1')break;
  if(s.mode==='dialog')await ack();
  await page().waitForTimeout(50);
 }
 await read('DART LEGACY POST 0/1/1');const bytes=await save();assert.equal(bytes.readInt32LE(4),929);
 fs.writeFileSync(path.join(output,'legacy-artifact-resumed.vsgm1'),bytes);await page().close();
 await boot({...options,doubleArtifactsConfigured:false,save:[...bytes],expectedDialog:'source-campaign'});await read('DART LEGACY POST 0/1/1');await ack();await read('DART LEGACY RESTORED 0');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const hero=await sheet();assert.equal([...(hero.slots||[]),...(hero.backpack||[])].filter(a=>a.name&&a.icon===7).length,1);
 report.scenarios.push({kind:'double-artifact-legacy-consumer',inputVersion:928,saveVersion:929,noRetroactiveDoublePickup:true,noRetroactiveMarking:true,globalEnableIgnored:true,pendingAndPostNativeSaveReload:true,physicalCopies:1});await page().close();
}
