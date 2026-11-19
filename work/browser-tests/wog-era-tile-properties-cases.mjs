import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function tilePropertiesProgram(){
 const query=`!!PO7/9/0:N?v31;
!!PO8/9/0:N?v32;
!!PO0/1/0:N?v33;
!!PO0/0/1:N?v34;
!!PO4/5/1:N?v35;
!!PO7/9/1:N?v36;
!!PO3/4/0:N?v37;`;
 const source=`ZVSE
!#PO7/9/0:N?v11 N-1 N?v12 Nd1 N?v13;
!#VRv998:S7;
!#VRv999:S9;
!#VRv1000:S0;
!#PO998:N31 N?v14;
!#PO8/9/0:N6 N?v15;
!#VRv2:S9;
!#VRv3:S8;
!#VRv4:S0;
!#PO2:N-16 N?v16;
!#PO65536/0/0:N14;
!#PO0/1/0:N?v17;
!#PO0/1024/0:N9;
!#PO0/0/1:N?v18;
!#PO4/5/2:N7;
!#PO4/5/1:N?v19;
!#PO7/9/1:N3;
!#PO3/4/0:N15 Nd2147483647 N?v20 Nd2147483647 N?v21;
!#IF:M^TILENUM INIT %V11/%V12/%V13/%V14/%V15/%V16/%V17/%V18/%V19/%V20/%V21^;
${query.replaceAll('!!','!#')}
!#IF:M^TILENUM READY %V31/%V32/%V33/%V34/%V35/%V36/%V37^;
!?GE2;
${query}
!!IF:M^TILENUM DAY2 %V31/%V32/%V33/%V34/%V35/%V36/%V37^;`;
 const program=compileErm(Buffer.from(source),{source:'Private native source PO:N probe'});
 program.originalMessages=['ZVSE private native companion town continuation'];return program;
}
export async function runTileProperties({boot,state,command,wait,page,report,output,save}){
 if(process.env.TILE_PROPERTIES_LEGACY_PRODUCER==='1'||process.env.TILE_PROPERTIES_LEGACY_SAVE){
  const scriptProgram=compileErm('ZVSE\n!#IF:M^TILENUM LEGACY PENDING^;\n!#PO7/9/0:N?v31;\n!#PO7/9/1:N?v32;\n!#IF:M^TILENUM LEGACY ZERO %V31/%V32^;',{source:'Private old-save-compatible tile property baseline'});
  scriptProgram.originalMessages=['ZVSE private native companion town continuation'];
  const options={enabled:false,scriptTown:true,tilePropertiesFixture:true,scriptProgram};
  const existing=process.env.TILE_PROPERTIES_LEGACY_SAVE;
  await boot({...options,...(existing?{save:[...fs.readFileSync(existing)]}:{}),expectedDialog:'source-campaign'});
  await wait(()=>goonkMobileState.dialogPresentation?.lines?.join(' ')==='TILENUM LEGACY PENDING');
  if(existing){
   await page().locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.dialogPresentation?.lines?.join(' ')==='TILENUM LEGACY ZERO 0/0');
   await page().locator('[data-dialog-confirm]').tap();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
  }
  const bytes=await save();fs.writeFileSync(path.join(output,'tile-properties-legacy.vsgm1'),bytes);
  assert.equal(bytes.readInt32LE(4),existing?928:927);
  report.scenarios.push({kind:existing?'tile-properties-legacy-consumer':'tile-properties-legacy-producer',saveVersion:bytes.readInt32LE(4),...(existing?{inputVersion:927,zeroDefaultBothLevels:true,noRetroactiveTileNumbers:true}:{})});
  await page().close();return;
 }
 const scriptProgram=tilePropertiesProgram();fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,tilePropertiesFixture:true,scriptProgram,
  ...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const read=async text=>{await wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);assert.equal((await state()).dialogPresentation.lines.join(' '),text);};
 const ack=async()=>{await page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();};
 await boot({...options,expectedDialog:'source-campaign'});await read('TILENUM INIT 0/15/0/15/6/0/14/9/7/14/13');
 const bytes=await save();fs.writeFileSync(path.join(output,'tile-properties-pending.vsgm1'),bytes);
 await page().close();await boot({...options,save:[...bytes],expectedDialog:'source-campaign'});
 await read('TILENUM INIT 0/15/0/15/6/0/14/9/7/14/13');await ack();
 await read('TILENUM READY 15/6/14/9/7/3/13');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 await command(3);await read('TILENUM DAY2 15/6/14/9/7/3/13');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const resumed=await save();fs.writeFileSync(path.join(output,'tile-properties-day2.vsgm1'),resumed);await page().close();
 await boot({...options,save:[...resumed]});assert.equal((await state()).day,2);
 report.scenarios.push({directCoordinates:true,indirectSelectors:[2,998],zeroDefault:true,nibbleWrap:true,signedOverflow:true,
  packedCoordinateAliases:true,independentSurfaceAndUnderground:true,independentNeighbours:true,pendingNativeSaveReload:true,dayTwoNativeSaveReload:true,
  viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});await page().close();
}
