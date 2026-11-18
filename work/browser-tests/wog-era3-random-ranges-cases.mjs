import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export const randomBounds=[[1,12],[-12,-1],[-4,4],[-2147483648,2147483647],[0,2147483647],[-2147483648,-1],[7,19],[-50,50]];
export function randomRangesFixture(){
 const draw=(prefix,index,[low,high])=>`${prefix}VRv${index}:S2000000000 R999/${low}/${high};`;
 const values=base=>randomBounds.map((_,i)=>'%V'+(base+i)).join('/');
 const source=`ZVSE2
!?FU9460;
${randomBounds.map((bounds,i)=>draw('!!',850+i,bounds)).join('\n')}
!!IF:M^RANGE AFTER ${values(850)}^;
!#VRv810:S2000000000 R777/7/7;
!#VRv811:R-88/9/3;
!#VRv812:R0/-11/-11;
!#VRv813:R0/-2147483648/-2147483648;
!#VRv814:R0/2147483647/2147483647;
!#VRv815:S123 R0 R-20;
!#IF:M^RANGE FIXED %V810/%V811/%V812/%V813/%V814/%V815^;
${randomBounds.map((bounds,i)=>draw('!#',830+i,bounds)).join('\n')}
!#IF:M^RANGE BEFORE ${values(830)}^;
!#FU9460:P;
!#IF:M^RANGE FINISH^;`;
 const p=compileErm(Buffer.from(source),{source:'Private ERA3 explicit random range probe'});
 p.originalMessages=['ZVSE private native companion town continuation'];return p;
}

export async function runRandomRanges({boot,state,wait,page,report,output,save}){
 const scriptProgram=randomRangesFixture();fs.writeFileSync(path.join(output,'random-ranges-program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const read=async prefix=>{await wait(prefix=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').startsWith(prefix),prefix);return(await state()).dialogPresentation.lines.join(' ');};
 const ack=async()=>{const previous=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await wait(previous=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==previous,previous);};
 const parse=(line,prefix)=>{const values=line.slice(prefix.length).split('/').map(Number);assert.equal(values.length,randomBounds.length);values.forEach((v,i)=>assert(Number.isInteger(v)&&v>=randomBounds[i][0]&&v<=randomBounds[i][1],line));return values;};
 await boot({...options,expectedDialog:'source-campaign'});
 const fixed=await read('RANGE FIXED ');assert.equal(fixed,'RANGE FIXED 7/9/-11/-2147483648/2147483647/123');await ack();
 const beforeText=await read('RANGE BEFORE '),before=parse(beforeText,'RANGE BEFORE ');
 const checkpoint=await save();fs.writeFileSync(path.join(output,'random-ranges-checkpoint.vsgm1'),checkpoint);
 await ack();const afterText=await read('RANGE AFTER '),after=parse(afterText,'RANGE AFTER ');
 await page().close();await boot({...options,save:[...checkpoint],expectedDialog:'source-campaign'});
 assert.equal(await read('RANGE BEFORE '),beforeText);await ack();assert.equal(await read('RANGE AFTER '),afterText);
 const pending=await save();fs.writeFileSync(path.join(output,'random-ranges-pending.vsgm1'),pending);
 await page().close();await boot({...options,save:[...pending],expectedDialog:'source-campaign'});assert.equal(await read('RANGE AFTER '),afterText);await ack();
 assert.equal(await read('RANGE FINISH'),'RANGE FINISH');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const complete=await save();fs.writeFileSync(path.join(output,'random-ranges-complete.vsgm1'),complete);
 await page().close();await boot({...options,save:[...complete]});assert.equal((await state()).mode,'map');
 report.scenarios.push({kind:'era3-random-ranges',fixed,before,after,bounds:randomBounds,checkpointReplayPreservesNativeRandomSequence:true,nestedNativeSaveReload:true,completedNativeSaveReload:true,assignmentReplacesPreviousValue:true,signedAndFullInt32Bounds:true,nativeSaveVersion:complete.readInt32LE(4),programSha256:scriptProgram.sha256,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
 await page().close();
}
