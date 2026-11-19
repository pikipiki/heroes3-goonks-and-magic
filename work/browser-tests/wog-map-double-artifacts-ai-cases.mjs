import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export async function runDoubleArtifactsAI({boot,sheet,state,command,wait,page,report,output,save}){
 const source=`ZVSE
!#HE0:A2/7/?v98/?v99;
!#HE0&v98>0:A3/7/v98/1;
!#UN:P119/?v10;
!#IF:M^DART AI INIT %V10^;
!?GE2;
!!HE0:O0;
!!HE0:A2/7/?v11/?v12;
!!PO9/11/0:N?v13;
!!IF:M^DART AI READY %V10/%V11/%V12/%V13^;
!!UN:P119/?v14;
!!IF:M^DART AI RESTORED %V14^;`;
 const scriptProgram=compileErm(Buffer.from(source),{source:'Private native source119 AI pickup'});scriptProgram.originalMessages=['ZVSE private native companion town continuation'];
 fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 for(const active of [true,false]){
  const options={enabled:false,scriptTown:true,reserveHero:true,artifactFixture:{ai:true,existing:'none'},scriptProgram,
   doubleArtifactChoice:active?1:0,doubleArtifactsConfigured:!active,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
  const read=text=>wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);
  const ack=async()=>{const text=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]').tap();await wait(text=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==text,text);};
  await boot({...options,expectedDialog:'source-campaign'});await read(`DART AI INIT ${Number(active)}`);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  await command(3);await read(`DART AI READY ${Number(active)}/${active?2:1}/1/0`);
  const bytes=await save();assert.equal(bytes.readInt32LE(4),929);fs.writeFileSync(path.join(output,`ai-${active}.vsgm1`),bytes);await page().close();
  await boot({...options,doubleArtifactsConfigured:active,save:[...bytes],expectedDialog:'source-campaign'});await read(`DART AI READY ${Number(active)}/${active?2:1}/1/0`);await ack();await read(`DART AI RESTORED ${Number(active)}`);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  const target=(await state()).heroes.find(h=>h.name==='Orrin');assert(target);await command(4,target.index);await wait(id=>goonkMobileState.heroId===id,target.id);await page().evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const hero=await sheet();assert.equal(hero.name,'Orrin');assert.equal([...(hero.slots||[]),...(hero.backpack||[])].filter(a=>a.name&&a.icon===7).length,active?2:1);
  report.scenarios.push({kind:'AI-artifact-pickup',active,copies:active?2:1,markerAfter:0,actualAIAdventureTurn:true,ownerTransferredForInspection:true,pendingNativeSaveReload:true,globalReversalPreserved:true});await page().close();
 }
}
