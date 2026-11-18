import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export function stringReceiversFixture(){
 const source=`ZVSE2
!#VA(root:z);
!#VR(root):S^initializer^;
!?FU9450;
!#VA(names[3]:z);
!!UN:N4/(@names)/0;
!!UN:N4/(@names[1])/1;
!!UN:N4/(@names[2])/2;
!!IF:M^STRCELLS NAMES %(names)/%(names[1])/%(names[2])^;
!!IF:M(@names);
!!FU9451:P;
!!IF:M^STRCELLS RETURN %(names)/%(names[1])/%(names[2])^;
!!IF:G0/945/0/(@names)/(@names[1])/(@names[2]);
!!IF:M^STRCELLS CHOICE %V945^;
!?FU9451;
!#VA(child:z);
!!UN:N4/(@child)/3;
!!IF:M(@child);
!#FU9450:P;
!#IF:M^STRCELLS ROOT %Z-1^;`;
 const p=compileErm(Buffer.from(source),{source:'Private native local-z receiver probe'});
 p.originalMessages=['ZVSE private native companion town continuation'];return p;
}

export async function runStringReceivers({boot,state,wait,page,report,output,save}){
 const old=process.env.STRING_RECEIVERS_OLD_CONTROL==='1',scriptProgram=stringReceiversFixture();
 fs.writeFileSync(path.join(output,'string-receivers-program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const read=async text=>{await wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);assert.equal((await state()).dialogPresentation.lines.join(' '),text);};
 const ack=async()=>{const before=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await wait(before=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==before,before);};
 const seen=[];const check=async text=>{await read(text);seen.push(text);await ack();};
 await boot({...options,expectedDialog:'source-campaign'});
 await check(old?'STRCELLS NAMES //':'STRCELLS NAMES Pathfinding/Archery/Logistics');
 await check('Pathfinding');await read('Scouting');
 const pending=await save();fs.writeFileSync(path.join(output,'string-receivers-pending.vsgm1'),pending);
 await page().close();await boot({...options,save:[...pending],expectedDialog:'source-campaign'});await check('Scouting');
 await check(old?'STRCELLS RETURN //':'STRCELLS RETURN Pathfinding/Archery/Logistics');
 await page().locator('[data-campaign-choice]').first().waitFor({state:'visible'});
 const choices=await page().locator('[data-campaign-choice]').evaluateAll(nodes=>nodes.map(node=>({value:node.dataset.campaignChoice,label:node.closest('label')?.textContent.trim()})));
 assert.deepEqual(choices.map(row=>row.value),['1','2']);
 assert(choices[0].label.includes('Archery'));assert(choices[1].label.includes(old?'Scouting':'Logistics'));
 await page().locator('[data-campaign-choice="2"]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();
 await ack();await check('STRCELLS CHOICE 2');await check('STRCELLS ROOT initializer');
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const complete=await save();fs.writeFileSync(path.join(output,'string-receivers-complete.vsgm1'),complete);
 await page().close();await boot({...options,save:[...complete]});assert.equal((await state()).mode,'map');
 report.scenarios.push({kind:'era3-string-receivers',oldControl:old,seen,choices,nativeNameOutputScoped:!old,numericDialogText:true,numericChecklistCells:true,nestedNativeSaveReload:true,completedNativeSaveReload:true,nativeSaveVersion:complete.readInt32LE(4),programSha256:scriptProgram.sha256,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
 await page().close();
}
