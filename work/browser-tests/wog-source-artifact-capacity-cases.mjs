import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runArtifactCapacity({boot,state,command,wait,page,report,output,readCompletedNativeSave}){
 const reserve=process.env.GRANT_RESERVE==='1',hero=reserve?4:6,press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
 const equip=reserve?[[31,5],[32,8],[33,2],[34,4],[36,0]].map(([artifact,slot])=>`!!HE4:A1/${artifact}/${slot};`).join('\n'):'';
 const text=`ZVSE\n!?GE2;\n${equip}\n!!HE${hero}:A2/35/?v8200/?v8201 A2/129/?v8202/?v8203;\n!!HE${hero}:A4/35;\n!!HE${hero}:A2/35/?v8210/?v8211 A2/129/?v8212/?v8213;\n!!IF:M^CAPACITY RESULT %V8200 %V8201 %V8202 %V8203 THEN %V8210 %V8211 %V8212 %V8213^;`;
 const program=compileErm(Buffer.from(text),{source:'Private original automatic grant to a reserve hero or a full backpack'});program.originalMessages=['ZVSE private native companion town continuation'];fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(program,null,2));
 const opts={enabled:false,scriptTown:true,scriptProgram:program,growthChoice:0,levelArtifactChoice:1,artifactPoolFixture:{allowed:['core:centaurAxe','core:blackshardOfTheDeadKnight','core:greaterGnollsFlail']},artifactGrantFixture:reserve?null:{fullBackpack:true},...(!process.env.GROWTH_DESKTOP?{viewport:{width:390,height:844}}:{})};
 await boot(opts);await command(3);await wait(()=>goonkMobileState.dialogPresentation?.lines?.some(l=>l.startsWith('CAPACITY RESULT ')));const message=(await state()).dialogPresentation.lines.join(' ');assert.equal(message,reserve?'CAPACITY RESULT 0 0 0 0 THEN 0 0 1 1':'CAPACITY RESULT 0 0 0 0 THEN 0 0 0 0');
 const saved=await readCompletedNativeSave(page(),command);assert.equal(saved.readInt32LE(4),Number(process.env.GOONK_EXPECTED_SAVE_VERSION||937));fs.writeFileSync(path.join(output,'pending.vsgm1'),saved);await page().close();await boot({...opts,save:[...saved],expectedDialog:'source-campaign'});await wait(message=>goonkMobileState.dialogPresentation?.lines?.includes(message),message);await page().locator('[data-dialog-confirm]')[press]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 report.scenarios.push({reserve,message,backpackCapacity:reserve?null:64,reserveAutomaticAssembly:reserve,failedPlacementDoesNotReplaceEquipment:!reserve,saveReload:true,input:press==='tap'?'touch':'mouse'});await page().close();
}
