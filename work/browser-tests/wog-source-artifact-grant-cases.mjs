import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runArtifactGrants({boot,sheet,state,command,wait,page,report,output,readCompletedNativeSave}){
 const reject=process.env.GRANT_REJECT==='1',ai=process.env.GRANT_AI==='1',press=process.env.GROWTH_DESKTOP==='1'?'click':'tap',hero=ai?0:6;
 const queries=prefix=>`${prefix}HE${hero}:A2/129/?v8200/?v8201 A2/35/?v8202/?v8203;\n${prefix}IF:M^GRANT RESULT %V8200 %V8201 %V8202 %V8203^;`;
 const text=`ZVSE\n!?GE2;\n!!HE${hero}:A-7 A-8 A-9;\n!!HE${hero}:A4/35;\n${queries('!!')}\n${reject?`!!HE${hero}:A-35 A4/35;\n${queries('!!')}`:''}\n${ai?'!!HE0:O0;':''}`;
 const program=compileErm(Buffer.from(text),{source:'Private source HE:A4 automatic equipment and persistent assembly decision'});program.originalMessages=['ZVSE private native companion town continuation'];fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(program,null,2));
 const opts={enabled:false,scriptTown:true,scriptProgram:program,growthChoice:0,levelArtifactChoice:1,artifactPoolFixture:{allowed:['core:centaurAxe','core:blackshardOfTheDeadKnight','core:greaterGnollsFlail']},artifactGrantFixture:{ai},enemyHero:ai,...(!process.env.GROWTH_DESKTOP?{viewport:{width:390,height:844}}:{})};
 const result=async()=>{await wait(()=>goonkMobileState.dialogPresentation?.lines?.join(' ').startsWith('GRANT RESULT '));return (await state()).dialogPresentation.lines.join(' ');};
 const assembly=async()=>wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.cancel&&goonkMobileState.dialogPresentation?.lines?.some(line=>/Angelic|Alliance/i.test(line)));
 const ack=async()=>page().locator('[data-dialog-confirm]')[press]();
 await boot(opts);await command(3);
 if(!ai){await assembly();const pending=await readCompletedNativeSave(page(),command);assert.equal(pending.readInt32LE(4),Number(process.env.GOONK_EXPECTED_SAVE_VERSION||937));fs.writeFileSync(path.join(output,'pending-assembly.vsgm1'),pending);await page().close();await boot({...opts,save:[...pending],expectedDialog:'source-campaign'});await assembly();await page().locator(reject?'[data-dialog-cancel]':'[data-dialog-confirm]')[press]();}
 const first=await result();assert.equal(first,ai||!reject?'GRANT RESULT 1 1 0 0':'GRANT RESULT 0 0 1 1');
 const after=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'result-pending.vsgm1'),after);await page().close();await boot({...opts,save:[...after],expectedDialog:'source-campaign'});assert.equal(await result(),first);await ack();
 if(reject){assert.equal(await result(),'GRANT RESULT 0 0 1 1');await ack();}
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);if(ai)await command(4,1);const window=await sheet();const slots=window.slots;assert(slots.some(s=>/Angelic Alliance/i.test(s.name||''))===!reject);assert(slots.some(s=>/Sword of Judgement/i.test(s.name||''))===reject);
 report.scenarios.push({reject,ai,first,pendingAssemblySaveReload:!ai,resultSaveReload:true,alreadySeenDoesNotAskAgain:reject,independentNativeEquipment:slots,saveVersion:Number(process.env.GOONK_EXPECTED_SAVE_VERSION||937),input:press==='click'?'mouse':'touch'});await page().close();
}
