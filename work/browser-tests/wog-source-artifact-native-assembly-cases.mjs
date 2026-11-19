import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runNativeAssembly({boot,state,command,wait,page,report,output,readCompletedNativeSave}){
 const press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
 const text='ZVSE\n!?GE2;\n!!HE6:A-7 A-8 A-9;\n!!IF:M^NATIVE ASSEMBLY READY^;\n!?GE3;\n!!HE6:A-35 A4/35;\n!!HE6:A2/129/?v8200/?v8201 A2/35/?v8202/?v8203;\n!!IF:M^NATIVE ASSEMBLY RESULT %V8200 %V8201 %V8202 %V8203^;';
 const program=compileErm(Buffer.from(text),{source:'Private ordinary native assembly choice shared with source automatic grants'});program.originalMessages=['ZVSE private native companion town continuation'];fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(program,null,2));
 const opts={enabled:false,scriptTown:true,scriptProgram:program,growthChoice:0,levelArtifactChoice:1,artifactPoolFixture:{levelDay3:true,allowed:['core:centaurAxe','core:blackshardOfTheDeadKnight','core:greaterGnollsFlail']},artifactGrantFixture:{nativeAssembly:true},viewport:{width:390,height:844}};
 await boot(opts);await command(3);await wait(()=>goonkMobileState.dialogPresentation?.lines?.includes('NATIVE ASSEMBLY READY'));await page().locator('[data-dialog-confirm]')[press]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 await page().mouse.move(400,300);await command(6);await page().waitForTimeout(150);await page().evaluate(()=>{const m=goonkMobileState.mapOverview,v=m.view;Module._vcmiMobilePointer(v.x+(10-m.viewport.x+.5)*32,v.y+v.h/2,1);});await wait(()=>goonkMobileState.hasPath);await command(2);
 await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation);if(!(await state()).dialogPresentation.cancel)await page().locator('[data-dialog-confirm]')[press]();
 await wait(()=>goonkMobileState.dialogPresentation?.cancel&&goonkMobileState.dialogPresentation?.lines?.some(l=>/Angelic Alliance/.test(l)));assert.equal((await state()).campaignPending,false);const cancel=page().locator('[data-dialog-cancel]');await (await cancel.isVisible()?cancel:page().locator('.dialog-presentation [data-ui-header-close=true]'))[press]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 const saved=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'native-refusal.vsgm1'),saved);await page().close();await boot({...opts,save:[...saved]});await command(3);
 await wait(()=>goonkMobileState.dialogPresentation?.lines?.includes('NATIVE ASSEMBLY RESULT 0 0 1 1'));const after=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'source-result.vsgm1'),after);await page().locator('[data-dialog-confirm]')[press]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 report.scenarios.push({ordinaryNativePickupPrompt:true,nativeRefusalSurvivesSave:true,sourceGrantDoesNotRepeatNativePrompt:true,stableArtifactKeyShared:true,input:press==='tap'?'touch':'mouse',saveVersion:saved.readInt32LE(4)});await page().close();
}
