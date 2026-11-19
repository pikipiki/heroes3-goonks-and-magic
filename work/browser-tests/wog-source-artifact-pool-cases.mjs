import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export async function runArtifactPool({boot,state,command,wait,page,report,output,readCompletedNativeSave}){
 const combo=process.env.POOL_COMBO==='1',press=process.env.GROWTH_DESKTOP==='1'?'click':'tap';
 const picks=(prefix,mask,base)=>Array.from({length:3},(_,i)=>`${prefix}UN:J6/${mask}/?v${base+i};`).join('\n');
 const head='!#HE6:A2/7/?v8280/?v8290 A2/8/?v8281/?v8290 A2/9/?v8282/?v8290;';
 const text=`ZVSE\n${head}\n${picks('!#',combo?16:2,8200)}\n!#IF:M^POOL FIRST %V8200 %V8201 %V8202 INITIAL %V8280 %V8281 %V8282^;\n${picks('!#',combo?16:2,8210)}\n!#IF:M^POOL SECOND %V8210 %V8211 %V8212^;\n!?GE2;\n${picks('!!',combo?16:4,8220)}\n!!IF:M^POOL FALLBACK %V8220 %V8221 %V8222^;`;
 const program=compileErm(Buffer.from(text),{source:'Private shared original artifact pool with save replay and class refill'});program.originalMessages=['ZVSE private native companion town continuation'];fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(program,null,2));
 const allowed=combo?['core:centaurAxe','core:angelicAlliance','wake-of-gods.level8units:magicWand']:['core:centaurAxe','core:blackshardOfTheDeadKnight','core:greaterGnollsFlail'];
 const opts={enabled:false,scriptTown:true,scriptProgram:program,growthChoice:0,levelArtifactChoice:1,levelArtifactsConfigured:false,artifactPoolFixture:{allowed},...(!process.env.GROWTH_DESKTOP?{viewport:{width:390,height:844}}:{})};
 const read=async(prefix)=>{await wait(prefix=>goonkMobileState.dialogPresentation?.lines?.join(' ').startsWith(prefix),prefix);return (await state()).dialogPresentation.lines.join(' ');};
 const ack=async()=>{await page().locator('[data-dialog-confirm]')[press]();};
 await boot({...opts,expectedDialog:'source-campaign'});const first=await read('POOL FIRST ');const pending=await readCompletedNativeSave(page(),command);assert.equal(pending.readInt32LE(4),937);fs.writeFileSync(path.join(output,'pending.vsgm1'),pending);await ack();const second=await read('POOL SECOND ');await page().close();
 await boot({...opts,levelArtifactsConfigured:true,save:[...pending],expectedDialog:'source-campaign'});assert.equal(await read('POOL FIRST '),first);await ack();assert.equal(await read('POOL SECOND '),second);await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);await command(3);const fallback=await read('POOL FALLBACK ');await ack();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 fs.writeFileSync(path.join(output,'observed.json'),JSON.stringify({first,second,fallback},null,2));
 const a=first.match(/^POOL FIRST (\d+) (\d+) (\d+) INITIAL (\d+) (\d+) (\d+)$/).slice(1).map(Number),b=second.match(/^POOL SECOND (\d+) (\d+) (\d+)$/).slice(1).map(Number),c=fallback.match(/^POOL FALLBACK (\d+) (\d+) (\d+)$/).slice(1).map(Number);const stream=[...a.slice(0,3),...b,...c];
 if(combo)assert(stream.every(id=>id===129));else{assert(stream.every(id=>[7,8,9].includes(id)));const initial=a.slice(3).reduce((s,n)=>s+n,0);assert(initial<=1);const usedAtStart=(initial+7)%3;const offset=usedAtStart===0?3:3-usedAtStart;assert.equal(new Set(stream.slice(0,offset)).size,offset);for(let at=offset;at+3<=stream.length;at+=3)assert.equal(new Set(stream.slice(at,at+3)).size,3);}
 report.scenarios.push({combo,first,second,fallback,stream,saveVersion:937,pendingNativeSaveReload:true,deterministicNextDraws:true,classRefill:true,bannedArtifactsExcluded:true,fallbackToOrdinaryClass:!combo,combinedPrototypeEligible:combo,disabled141Excluded:combo,input:press==='click'?'mouse':'touch'});await page().close();
}
