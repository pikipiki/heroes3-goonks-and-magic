import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runDarkness({boot,state,command,wait,approachEnemy,page,report,output,readCompletedNativeSave}){
 const currentVersion=Number(process.env.GOONK_EXPECTED_SAVE_VERSION||936);
 const historical=process.env.DARKNESS_OLD_CONTROL==='1',legacy=process.env.DARKNESS_LEGACY_SAVE;
 const choice=historical?null:Number(process.env.DARKNESS_CHOICE??1),configured=process.env.DARKNESS_CONFIGURED==='1',active=!historical&&!legacy&&(choice<0?configured:choice===1),allied=process.env.DARKNESS_ALLIED==='1',argument=process.env.FOG_ARGUMENT===undefined?null:Number(process.env.FOG_ARGUMENT),press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
 const reveal=prefix=>[0,1].map(z=>`${prefix}UN:S18/18/${z}/0/36;`).join('\n');
 const text=`ZVSE\n${reveal('!#')}\n${argument===null?'':`!#UN:H20/20/0/${argument}/1;`}\n${historical||legacy?'!#VRv8200:S0;':'!#UN:P120/?v8200;'}\n!#IF:M^FOG READY %V8200^;\n!?GE2;\n${reveal('!!')}\n!!IF:M^FOG DAY2^;\n`;
 const program=compileErm(Buffer.from(text),{source:'Private source120 movement and UN:H preservation witnesses'});program.originalMessages=['ZVSE private native companion town continuation'];fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(program,null,2));
 const opts={enabled:false,scriptTown:true,scriptProgram:program,growthChoice:0,fogChoice:choice,fogConfigured:configured,fogFixture:{allied},settings:{ai:{adventureEnemyAI:'EmptyAI',adventureAlliedAI:'EmptyAI'}},...(process.env.DARKNESS_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const ack=async()=>{await page().locator('[data-dialog-confirm]')[press]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);};
 const witness=async(text)=>wait(text=>goonkMobileState.dialogPresentation?.lines?.join(' ')===text,text);
 const sample=async(level,x=31,y=5)=>{await command(4,level===0?0:1);await wait(level=>goonkMobileState.mapOverview?.level===level&&goonkMinimapLevel===level,level);await page().waitForTimeout(500);return page().evaluate(({x,y})=>Array.from(goonkMinimapAtlas.getContext('2d').getImageData(Math.floor((x+.5)*240/36),Math.floor((y+.5)*240/36),1,1).data),{x,y});};
 const visible=rgb=>rgb.slice(0,3).some(v=>v!==0);
 const both=async()=>{const values=[await sample(0),await sample(1)];await command(4,0);await wait(()=>goonkMobileState.mapOverview?.level===0);return values;};
 const move=async()=>{await command(4,0);const before=(await state()).heroes[0].movement;await approachEnemy();await wait(before=>goonkMobileState.mode==='map'&&!goonkMobileState.heroMoving&&goonkMobileState.heroes?.[0]?.movement<before,before);};
 if(legacy)await boot({...opts,save:[...fs.readFileSync(legacy)]});else{await boot({...opts,expectedDialog:'source-campaign'});await witness(`FOG READY ${+active}`);await ack();}
 const initial=await both();assert(initial.every(visible));
 const circle={center:await sample(0,20,20),diagonal:await sample(0,21,21),outside:await sample(0,22,20)};
 const preserved=argument===0||(allied&&argument===1);if(argument!==null){assert.equal(visible(circle.center),historical?argument!==0:preserved);assert.equal(visible(circle.diagonal),historical?argument!==0:preserved);assert(visible(circle.outside));}
 const saved=await readCompletedNativeSave(page(),command);assert.equal(saved.readInt32LE(4),historical?935:currentVersion);fs.writeFileSync(path.join(output,'day1-complete.vsgm1'),saved);
 await move();const afterMove=await both();assert(afterMove.every(rgb=>visible(rgb)===!active));const ownSight=await sample(0,9,9);assert(visible(ownSight));
 const moved=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'moved.vsgm1'),moved);await page().close();await boot({...opts,fogConfigured:!configured,save:[...moved]});assert.deepEqual(await both(),afterMove);
 await command(3);await witness('FOG DAY2');const pending=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'pending.vsgm1'),pending);await page().close();await boot({...opts,fogConfigured:!configured,save:[...pending],expectedDialog:'source-campaign'});await witness('FOG DAY2');await ack();const day2BeforeMove=await both();assert(day2BeforeMove.every(visible));await move();const day2AfterMove=await both();assert(day2AfterMove.every(rgb=>visible(rgb)===!active));
 await page().screenshot({path:path.join(output,'darkness-map.png')});report.scenarios.push({choice,configured,active,allied,argument,historicalNativeControl:historical,legacyInput:legacy?935:null,initial,circle,afterMove,ownSight,day2BeforeMove,day2AfterMove,bothMapLevels:true,ownedSightPreserved:true,noTurnStartClear:true,pendingSaveReload:true,reversedGlobalDefault:true,input:press==='click'?'mouse':'touch',saveVersion:historical?935:currentVersion});await page().close();
}
