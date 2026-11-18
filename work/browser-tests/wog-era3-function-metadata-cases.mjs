import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function functionMetadataFixture(){
 const source=`!?FU9415;
!!FU:A?y1 S1/?y2 S2/?y3 S16/?y4;
!!FU:A11/22/33 A?y5;
!!IF:M^META ROW %V970 %Y1 %X1/%X2/%X3 flags %Y2/%Y3/%Y4 count %Y5^;
!!FU:A?y6 S1/?y7;
!!IF:M^META RETURN %V970 %Y6/%Y7^;
!?FU9416;
!!FU:A?y1 S1/?y2;
!!VRv970:S5;
!!FU9415:P?x1;
!!FU:A?y3 S1/?y4;
!!IF:M^META NESTED %Y1/%Y2/%Y3/%Y4 caller %X1/%X2^;
!?FU9417;
!!VRx1:S5;!!VRx2:S6;
!!FU:A44/x1/x2 A?y1;
!!IF:M^META DEFAULTS %X1/%X2/%X3 count %Y1^;
!?FU9418;
!!FU:A77 A?i^metaCount^ S1/?f;
!!SN:W^metaCount^/?v973;!!VRv974:Sf;
!!IF:M^META ONEDEFAULT %X1 count %V973 flag %V974^;
!#FU:A?y1 S16/?y2;
!#IF:M^META ROOT %Y1/%Y2^;
!#VRv970:S0;!#FU9415:P;
!#VRv970:S1;!#FU9415:P7;
!#VRv971:S8;!#VRv970:S2;!#FU9415:P?v971;
!#VRv970:S3;!#FU9415:P7/?v971;
!#VRv970:S4;!#FU9415:P${Array.from({length:15},(_,i)=>i+1).join('/')}/?v971;
!#FU9416:P9/10;
!#FU9417:P;
!#FU9418:P P9;
!#IF:M^META FINISH %V971^;`;
 const program=compileErm(Buffer.from(source),{source:'Private ERA3 numeric argument metadata probe',dialect:'era3'});
 program.originalMessages=['ZVSE private native companion town continuation'];return program;
}

export async function runFunctionMetadata({boot,state,wait,page,command,save,report,output}){
 const scriptProgram=functionMetadataFixture();fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 await boot({...options,expectedDialog:'source-campaign'});
 const read=async prefix=>{await wait(prefix=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.some(line=>line.includes(prefix)),prefix);return(await state()).dialogPresentation.lines.join(' ');};
 const ack=async()=>{
  const previous=(await state()).dialogPresentation.lines.join(' ');
  await page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();
  await wait(previous=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==previous,previous);
 };
 const check=async expected=>{const text=await read(expected.split(' ').slice(0,2).join(' '));assert.equal(text,expected);await ack();return text;};
 await check('META ROOT 0/1');const cases=[];
 const expectedRows=['0 0 11/22/33 flags 1/1/1 count 0','1 1 7/22/33 flags 1/1/1 count 1',
  '2 1 8/22/33 flags 0/1/1 count 1','3 2 7/8/33 flags 1/0/1 count 2',
  '4 16 1/2/3 flags 1/1/0 count 16','5 1 9/22/33 flags 0/1/1 count 1'];
 for(let i=0;i<expectedRows.length;i++){
  const text=await read('META ROW '+i);assert.equal(text,'META ROW '+expectedRows[i]);
  if(i===5){
   const bytes=await save();fs.writeFileSync(path.join(output,'nested-metadata-pending.vsgm1'),bytes);
   await page().close();await boot({...options,save:[...bytes],expectedDialog:'source-campaign'});assert.equal(await read('META ROW 5'),text);
  }
  await ack();const count=[0,1,1,2,16,1][i],flag=[1,1,0,1,1,0][i];
  const returned=await check(`META RETURN ${i} ${count}/${flag}`);cases.push({text,returned,count,flag});
 }
 const nested=await check('META NESTED 2/1/2/1 caller 9/10');
 const defaults=await check('META DEFAULTS 44/5/6 count 0');
 await check('META ONEDEFAULT 77 count 0 flag 1');await check('META ONEDEFAULT 9 count 1 flag 1');
 await check('META FINISH 8');await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const bytes=await save();fs.writeFileSync(path.join(output,'metadata-complete.vsgm1'),bytes);
 await page().close();await boot({...options,save:[...bytes]});assert.equal((await state()).mode,'map');
 report.scenarios.push({kind:'era3-function-metadata',cases,nested,defaults,rootCount:0,rootSyntax:1,namedCountAndFastSyntax:true,
  nestedNativeSaveReload:true,completedNativeSaveReload:true,programSha256:scriptProgram.sha256,
  viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
 await page().close();
}
