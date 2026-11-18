import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';

export const quickNames=Array.from({length:15},(_,i)=>String.fromCharCode(102+i));
export const quickInitial=quickNames.map((_,i)=>i===0?-2147483648:i===14?2147483647:11+i);
const capture=base=>quickNames.map((name,i)=>`!!VRv${base+i}:S${name};`).join('\n');
const values=base=>quickNames.map((_,i)=>'%V'+(base+i)).join('/');
export function quickScopeFixture(){
 const source=`ZVSE2
!?FU9426;
!#VA(result:x);
!!VRv980:Sf;
${quickNames.map((name,i)=>`!!VR${name}:S${1000+i};`).join('\n')}
!!FU9427:P?g;
${capture(930)}
!!IF:M^QUICK RETURN ${values(930)}^;
!!VR(result):S42;
!!FU:E;
!!VRv982:S999;
!?FU9427;
!#VA(result:x);
!!VRv981:Sf;
${quickNames.map((name,i)=>`!!VR${name}:S${2000+i};`).join('\n')}
!!VR(result):S55;
${capture(910)}
!!IF:M^QUICK NESTED ${values(910)}^;
!?FU9428;
!!VRf:S999;
!!IF:M^QUICK EMPTY CALLEE^;
!#FU9428:P;
!#VRv983:Sf;
!#IF:M^QUICK EMPTY RETURN %V983^;
${quickNames.map((name,i)=>`!#VR${name}:S${quickInitial[i]};`).join('\n')}
!#FU9426:P?f;
${capture(950).replaceAll('!!','!#')}
!#IF:M^QUICK ROOT ${values(950)} inherited %V980/%V981 unreachable %V982^;`;
 const p=compileErm(Buffer.from(source),{source:'Private original ERA3 FU quick-register scope probe'});
 p.originalMessages=['ZVSE private native companion town continuation'];return p;
}

export async function runQuickScope({boot,state,wait,page,report,output,save}){
 const scriptProgram=quickScopeFixture();fs.writeFileSync(path.join(output,'quick-scope-program.json'),JSON.stringify(scriptProgram,null,2));
 const options={enabled:false,scriptTown:true,scriptProgram,...(process.env.AC_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 if(process.env.QUICK_OLD_READER_SAVE){
  const bytes=fs.readFileSync(process.env.QUICK_OLD_READER_SAVE);let accepted=false;
  const attempt=boot({...options,save:[...bytes],expectedDialog:'source-campaign'}).then(()=>{accepted=true;return true;},()=>false);
  for(let tick=0;tick<200&&(!page()||page().isClosed());tick++)await new Promise(resolve=>setTimeout(resolve,50));
  await wait(()=>{try{return /Warning format version mismatch: found \d+ when current is \d+/.test(Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));}catch{return false;}});
  const log=await page().evaluate(()=>Module.FS.readFile('/home/web_user/.cache/vcmi/VCMI_Client_log.txt',{encoding:'utf8'}));
  const match=log.match(/Warning format version mismatch: found (\d+) when current is (\d+)/);assert(match);assert.equal(Number(match[1]),bytes.readInt32LE(4));assert(Number(match[1])>Number(match[2]));
  assert.notEqual((await state()).mode,'map');assert.equal(accepted,false);
  fs.writeFileSync(path.join(output,'old-reader-rejection.log'),log);
  report.scenarios.push({kind:'era3-quick-scope-old-reader',futureVersion:Number(match[1]),readerVersion:Number(match[2]),rejectedBeforeScriptExecution:true});
  await page().close();await attempt;return;
 }
 const old=process.env.QUICK_OLD_CONTROL==='1'||!!process.env.QUICK_LEGACY_SAVE&&process.env.QUICK_LEGACY_HAS_SNAPSHOT!=='1';
 const returned=quickNames.map((_,i)=>i===1?55:(old?2000:1000)+i);
 const root=old?quickNames.map((_,i)=>i===0?42:i===1?55:2000+i):quickInitial.map((value,i)=>i===0?42:value);
 const nested='QUICK NESTED '+quickNames.map((_,i)=>2000+i).join('/');
 const read=async text=>{await wait(text=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);return(await state()).dialogPresentation.lines.join(' ');};
 const ack=async()=>{const previous=(await state()).dialogPresentation.lines.join(' ');await page().locator('[data-dialog-confirm]')[process.env.GROWTH_DESKTOP==='1'?'click':'tap']();await wait(previous=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==previous,previous);};
 const check=async text=>{const result=await read(text);await ack();return result;};
 let empty=null;
 if(process.env.QUICK_LEGACY_SAVE){
  await boot({...options,save:[...fs.readFileSync(process.env.QUICK_LEGACY_SAVE)],expectedDialog:'source-campaign'});
 }else{
  await boot({...options,expectedDialog:'source-campaign'});await read('QUICK EMPTY CALLEE');
  const emptyBytes=await save();fs.writeFileSync(path.join(output,'quick-empty-pending.vsgm1'),emptyBytes);
  await page().close();await boot({...options,save:[...emptyBytes],expectedDialog:'source-campaign'});await read('QUICK EMPTY CALLEE');await ack();
  empty=await check('QUICK EMPTY RETURN '+(old?999:0));
 }
 await read(nested);
 const pending=await save();fs.writeFileSync(path.join(output,'quick-nested-pending.vsgm1'),pending);
 await page().close();await boot({...options,save:[...pending],expectedDialog:'source-campaign'});await read(nested);await ack();
 await check('QUICK RETURN '+returned.join('/'));
 const rootText=await check('QUICK ROOT '+root.join('/')+' inherited -2147483648/1000 unreachable 0');
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const finished=await save();fs.writeFileSync(path.join(output,'quick-scope-complete.vsgm1'),finished);
 await page().close();await boot({...options,save:[...finished]});assert.equal((await state()).mode,'map');
 report.scenarios.push({kind:'era3-quick-scope',historicalSharedBehavior:old,legacyPendingSave:!!process.env.QUICK_LEGACY_SAVE,empty,nested,returned,root,rootText,allFifteenQuickRegisters:true,copyOutAfterRestoration:!old,earlyReturn:true,emptyScopeNativeSaveReload:empty!==null,nestedNativeSaveReload:true,completedNativeSaveReload:true,nativeSaveVersion:finished.readInt32LE(4),programSha256:scriptProgram.sha256,viewport:page().viewportSize(),input:process.env.GROWTH_DESKTOP==='1'?'mouse':'touch'});
 await page().close();
}
