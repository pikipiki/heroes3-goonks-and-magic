import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
import {mithrilDwellingLevelsFixture} from './wog-mithril-dwelling-levels-cases.mjs';
export function liveCreatureLevelsFixture(){
 const dwellingQueries=Array.from({length:6},(_,i)=>`!!DW${10+i*3}/11/0:M0/?v810/?v811;\n!!IF:M^LIVE STOCK ${i} %V810/%V811^;`).join('\n');
 const p=compileErm(`ZVSE2
!#MA:L0/?v7100 L6/?v7101;
!#MA:L0/6 L0/d2147483647 L0/?v7180 L0/4;
!#MA:L1/-1 L1/d-2147483648 L1/?v7181 L1/4;
!#MA:L90/6 L91/6 L10/-2147483648 L11/-2 L6/3 L62/6 L63/6 L64/7 L65/2147483647;
!#MA:L0/?v7110 L1/?v7111 L10/?v7112 L11/?v7113 L64/?v7114 L65/?v7115;
!#IF:M^LIVE LEVELS INIT %V7100/%V7101 %V7180/%V7181 %V7110/%V7111/%V7112/%V7113/%V7114/%V7115^;
!?OB17;
!!MA:L0/6 L1/6;
${dwellingQueries}
!?GE2;
!!MA:L0/?v7110 L1/?v7111 L10/?v7112 L11/?v7113 L64/?v7114 L65/?v7115;
!!IF:M^LIVE LEVELS NEXT %V7110/%V7111/%V7112/%V7113/%V7114/%V7115^;`,{source:'Private native map-local MA:L and mithril quote validation'});
 p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runMithrilLiveLevels({boot,state,command,wait,walk,panel,buy,page,output,report,readCompletedNativeSave}){
 const classic=process.env.CASES==='live-levels-classic';
 const mouse=classic||process.env.CASES.endsWith('-desktop'),action=mouse?'click':'tap';
 const options={enabled:true,dwellingLevelFixture:true,...(process.env.MITHRIL_LIVE_LEVELS_PORTRAIT==='1'?{viewport:{width:390,height:844}}:{})};
 const baseline=[1,1,2,null,1,2],costsOf=data=>Array.from({length:6},(_,i)=>data.offers.find(row=>row.id===i+3&&row.kind===1)?.cost??null);
 if(process.env.MITHRIL_LIVE_LEVELS_LEGACY==='1'){
  const old=process.env.MITHRIL_LIVE_LEVELS_LEGACY_SAVE;
  await boot({...options,scriptProgram:mithrilDwellingLevelsFixture(),...(old?{enabled:false,save:[...fs.readFileSync(old)]}:{})});
  const data=await panel();assert.deepEqual(costsOf(data),baseline);assert.equal(data.amount,100);
  await page().locator('[data-mithril-close]')[action]();
  const bytes=await readCompletedNativeSave(page(),command,{tag:851});fs.writeFileSync(path.join(output,'legacy-dwelling-levels.vsgm1'),bytes);
  assert.equal(bytes.readInt32LE(4),old?926:925);
  report.scenarios.push({kind:old?'live-levels-legacy-consumer':'live-levels-legacy-producer',costs:costsOf(data),amount:data.amount,saveVersion:bytes.readInt32LE(4),...(old?{inputVersion:fs.readFileSync(old).readInt32LE(4),oldPricesPreserved:true}:{} )});await page().close();return;
 }
 const scriptProgram=liveCreatureLevelsFixture();fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(scriptProgram,null,2));
 await boot({...options,scriptProgram,expectedDialog:'source-campaign'});
 const init=(await state()).dialogPresentation.lines.join(' ');assert(init.includes('LIVE LEVELS INIT 0/0 -1/6 4/4/-1/-1/6/6'),init);
 await command(1);await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);
 if(classic){
  await page().evaluate(()=>Module._vcmiMobileEnable(2));await page().mouse.move(400,300);await page().waitForTimeout(200);await command(6);await page().waitForTimeout(200);
  const click=async()=>{const target=await page().evaluate(()=>{const c=Module.canvas,b=c.getBoundingClientRect(),v=goonkMobileState.mapOverview.view;return{x:b.x+(v.x+v.w/2+64)*b.width/c.width,y:b.y+(v.y+v.h/2)*b.height/c.height};});await page().mouse.click(target.x,target.y,{button:'right'});};
  await click();await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').includes('2 Mithril / 100'));
  await page().screenshot({path:path.join(output,'classic-live-levels-price.png')});await command(0);await wait(()=>goonkMobileState.mode==='map');assert.equal((await state()).resources[7],100);
  await click();await wait(()=>goonkMobileState.mode==='dialog');await command(1);await wait(()=>goonkMobileState.resources[7]===98);
  const bytes=await readCompletedNativeSave(page(),command,{tag:853});assert.equal(bytes.readInt32LE(4),926);await page().close();await boot({...options,scriptProgram,enabled:false,save:[...bytes]});
  await command(1201,1);await wait(()=>goonkMobileState.mithril?.amount===98);assert(!(await state()).mithril.offers.some(row=>row.id===3&&row.kind===1));
  report.scenarios.push({kind:'live-levels-classic',cost:2,cancelPreservesResources:true,paidMithril:2,nativeSaveReload:true,saveVersion:926,input:'mouse',classic:true});await page().close();return;
 }
 const first=await panel();assert.deepEqual(costsOf(first),[2,3,1,1,3,3]);const oldRevision=first.revision,quoted=first.offers.find(row=>row.id===3&&row.kind===1);assert(quoted);
 await page().locator('[data-mithril-close]')[action]();
 const listen=()=>page().evaluate(()=>{window.privateLiveStocks=[];window.addEventListener('goonk-state',event=>{const t=event.detail.dialogPresentation?.lines?.find(t=>t.startsWith('LIVE STOCK '));if(t&&window.privateLiveStocks.at(-1)!==t)window.privateLiveStocks.push(t);});});
 const rows=async()=>{const messages=await page().evaluate(()=>window.privateLiveStocks.slice(-6));assert.equal(messages.length,6);return messages.map((text,index)=>{const m=text.match(/^LIVE STOCK (\d+) (\d+)\/(\d+)$/);assert(m,text);assert.equal(Number(m[1]),index);return [Number(m[2]),Number(m[3])];});};
 const closeRecruit=async()=>{if((await state()).mode==='recruit')await page().locator('[data-ui=cancel-recruit]:visible').first()[action]();await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn);};
 await listen();await walk(5,0);const initial=await rows();await closeRecruit();
 assert.deepEqual(initial.map(row=>row[0]),[0,90,10,6,62,64]);
 let current=await panel();assert.deepEqual(costsOf(current),[3,3,1,1,3,3]);assert(current.revision>oldRevision);
 await command(1200,quoted.id,0,oldRevision);await page().waitForTimeout(250);assert.equal((await state()).mithril.amount,100,'An old quote cannot charge a changed price');
 const purchases=[];let remaining=100;
 for(const[index,cost]of [[0,3],[1,3],[2,1],[3,1],[4,3],[4,6],[5,3]]){
  current=await panel();const offer=current.offers.find(row=>row.id===index+3&&row.kind===1);assert(offer);assert.equal(offer.cost,cost);await buy(offer);remaining-=cost;assert.equal((await state()).mithril.amount,remaining);purchases.push({index,cost,remaining});
 }
 assert.equal(remaining,80);await page().locator('[data-mithril-close]')[action]();
 const bytes=await readCompletedNativeSave(page(),command,{tag:852});assert.equal(bytes.readInt32LE(4),926);fs.writeFileSync(path.join(output,'live-dwelling-levels.vsgm1'),bytes);
 await page().close();await boot({...options,scriptProgram,enabled:false,save:[...bytes]});await listen();
 assert.equal((await panel()).amount,80);await page().locator('[data-mithril-close]')[action]();
 await walk(-1,0);await walk(1,0);const restored=await rows();await closeRecruit();
 assert.deepEqual(restored.map(row=>row[0]),[1,91,11,7,91,65]);assert.deepEqual(restored.map(row=>row[1]),initial.map(row=>row[1]));
 await command(3);await wait(()=>goonkMobileState.mode==='dialog'&&goonkMobileState.dialogPresentation?.lines?.join(' ').includes('LIVE LEVELS NEXT '));
 const next=(await state()).dialogPresentation.lines.join(' ');assert(next.includes('LIVE LEVELS NEXT 6/6/-1/-1/6/6'),next);await command(1);await wait(()=>goonkMobileState.mode==='map');
 await page().screenshot({path:path.join(output,'live-levels-restored.png')});
 report.scenarios.push({kind:'live-creature-levels',initialMessage:init,restoredMessage:next,initialCosts:costsOf(first),changedCosts:[3,3,1,1,3,3],initial,restored,purchases,remaining,oldQuoteRejected:true,signedClamp:true,wrapBeforeClamp:true,nativeSaveReload:true,reversedGlobalDefault:true,saveVersion:926,viewport:page().viewportSize(),input:mouse?'mouse':'touch'});
 await page().close();await boot(options);const fresh=await panel();assert.deepEqual(costsOf(fresh),baseline);assert.equal(fresh.amount,100);report.scenarios.push({kind:'live-levels-fresh-game',costs:costsOf(fresh),noCrossGameLevelLeak:true});await page().close();
}
