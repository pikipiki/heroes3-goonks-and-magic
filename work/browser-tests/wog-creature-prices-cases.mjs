import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compileErm} from '../../scripts/era-bridge/campaigns/parser.mjs';
export function creaturePricesProgram({historical=false}={}){
 const red=Array.from({length:9},(_,i)=>`!?GE${i+1};
!!MA:C0/6/?v8200 C146/6/?v8201;
${historical?'!!VRv8202:S0;':'!!UN:P113/?v8202;'}
!!IF:M^PRICE ${i+1} %V8200 MACHINE %V8201 AI %V8210 RULE %V8202^;`).join('\n');
 const blue=Array.from({length:9},(_,i)=>`!?GE${i+101};\n!!MA:C0/6/?v8210;`).join('\n');
 const p=compileErm(Buffer.from('ZVSE\n'+red+'\n'+blue),{source:'Private source113 global prices across player turns'});p.originalMessages=['ZVSE private native mithril option query'];return p;
}
export async function runCreaturePrices({boot,state,command,wait,page,report,output,readCompletedNativeSave}){
 const mouse=process.env.CASES.endsWith('-desktop'),press=mouse?'click':'tap';
 const historical=process.env.PRICES_OLD_CONTROL==='1',legacy=process.env.PRICES_LEGACY_SAVE;
 const expectedVersion=historical?932:Number(process.env.GOONK_EXPECTED_SAVE_VERSION||933);
 const enabled=process.env.PRICES_DISABLED!=='1';
 const forced=process.env.PRICES_CHOICE===undefined?null:Number(process.env.PRICES_CHOICE);
 const fixture={fightValue:123456,gold:129,halfPrices:legacy?true:forced===null?enabled:!enabled,priceCalendar:true,purchase:process.env.PRICES_PURCHASE==='1'};
 const program=creaturePricesProgram({historical:historical||!!legacy});fs.writeFileSync(path.join(output,'program.json'),JSON.stringify(program,null,2));
 const opts={halfPricesChoice:forced,enabled:false,creatureCostFixture:fixture,scriptProgram:program,...(!mouse?{viewport:{width:390,height:844}}:{})};
 const read=async(day)=>{await wait(day=>goonkMobileState.dialogPresentation?.lines?.join(' ').startsWith('PRICE '+day+' '),day);const s=await state(),text=s.dialogPresentation.lines.join(' ');return {text,values:text.match(/^PRICE (\d+) (-?\d+) MACHINE (-?\d+) AI (-?\d+) RULE (-?\d+)$/)?.slice(1).map(Number)};};
 const ack=async()=>{const s=await state(),old={text:s.dialogPresentation?.lines?.join(' '),id:s.dialogPresentation?.queryId};await page().locator('[data-dialog-confirm]')[press]();await wait(old=>goonkMobileState.mode!=='dialog'||goonkMobileState.dialogPresentation?.lines?.join(' ')!==old.text||goonkMobileState.dialogPresentation?.queryId!==old.id,old);};
 const map=async()=>{for(let i=0;i<600;i++){const s=await state();if(s.mode==='map'&&s.turn)return;if(s.mode==='dialog'){assert(!s.dialogPresentation?.lines?.join(' ').startsWith('PRICE '));const ready=await page().evaluate(()=>{const button=document.querySelector('[data-dialog-confirm]');return !!button&&!button.disabled&&button.getClientRects().length>0;});if(ready)await ack();}await page().waitForTimeout(30);}throw Error('Price calendar did not settle');};
 await boot({...opts,...(legacy||process.env.PRICES_START_SAVE)?{save:[...fs.readFileSync(legacy||process.env.PRICES_START_SAVE)]}:{},expectedDialog:'source-campaign'});
 let machine;
 for(let day=legacy?3:process.env.PRICES_START_SAVE?7:1;day<=9;day++){
  const observed=await read(day);assert(observed.values,observed.text);const [d,gold,machineCost,ai,rule]=observed.values;
  if(machine===undefined)machine=machineCost;
  const expected=!enabled?129:day<=2?129:day===7?64:128;
  const expectedAi=day===1?0:!enabled||day===2?129:64;
  assert.equal(d,day);assert.equal(gold,expected,observed.text);assert.equal(ai,expectedAi,observed.text);assert.equal(rule,enabled?1:0);assert.equal(machineCost,machine);
  if(day===3||day===7){const save=await readCompletedNativeSave(page(),command);assert.equal(save.readInt32LE(4),expectedVersion);fs.writeFileSync(path.join(output,`day${day}-pending.vsgm1`),save);await page().close();await boot({...opts,creatureCostFixture:{...fixture,halfPrices:!enabled},save:[...save],expectedDialog:'source-campaign'});assert.deepEqual(await read(day),observed);}
  await ack();await map();const unit=(await state()).armies.flatMap(a=>a.slots||[]).find(u=>u?.key==='core:pikeman');assert(unit);assert.equal(unit.cost[6],expected);assert.equal(unit.cost[7],37);assert.equal(unit.fightValue,123456);
  if(day===7&&fixture.purchase)await purchase({state,command,wait,page,press,report,output});
  report.scenarios.push({day,humanGold:gold,precedingAiGold:ai,machineGold:machineCost,enabled,independentNativeGold:unit.cost[6],mithril:unit.cost[7],fightValue:unit.fightValue,savedPendingReload:[3,7].includes(day),input:mouse?'mouse':'touch'});
  if(day<9)await command(3);
 }
 const complete=await readCompletedNativeSave(page(),command);fs.writeFileSync(path.join(output,'complete.vsgm1'),complete);await page().close();await boot({...opts,save:[...complete]});assert.equal((await state()).mode,'map');await page().close();console.log('PASS native creature price calendar',enabled,report.scenarios.length);
}

async function purchase({state,command,wait,page,press,report,output}){
 await command(5,0);await wait(()=>goonkMobileState.mode==='town');
 const town=(await state()).armyTownId;
 await command(30,0);await wait(()=>goonkMobileState.mode==='recruit'&&goonkMobileState.previewUnits?.length);
 const pikeman=(await state()).previewUnits.find(u=>u.key==='core:pikeman');assert(pikeman);
 await page().evaluate(p=>Module._vcmiMobilePointer(p.x+p.w/2,p.y+p.h/2,1),pikeman.preview);
 await wait(()=>goonkMobileState.recruitUnit?.key==='core:pikeman');
 const before=await state();assert.deepEqual(before.recruitUnit.cost,[1,2,3,4,5,6,64,37]);assert(before.recruitMaximum>=1);
 const slider=page().locator('#recruit-range');await slider.scrollIntoViewIfNeeded();const box=await slider.boundingBox();assert(box);
 const x=box.x+8+(box.width-16)/before.recruitMaximum,y=box.y+box.height/2;
 if(press==='click')await page().mouse.click(x,y);else await page().touchscreen.tap(x,y);
 await wait(()=>goonkMobileState.recruitAmount===1);
 await page().locator('[data-ui=confirm-recruit]:visible')[press]();await wait(value=>goonkMobileState.resources[6]===value,before.resources[6]-64);
 const paid=await state();assert.deepEqual(paid.resources,before.resources.map((amount,i)=>amount-before.recruitUnit.cost[i]));
 if(paid.mode==='recruit')await command(33);await wait(()=>goonkMobileState.mode==='town');
 const garrison=(await state()).armies.find(a=>a.slots?.some(u=>u?.key==='core:pikeman'));assert(garrison);
 const slot=garrison.slots.findIndex(u=>u?.key==='core:pikeman');assert.equal(garrison.slots[slot].count,1);
 await command(9,0,0,1);await page().waitForTimeout(500);assert.deepEqual((await state()).resources,paid.resources);assert.equal((await state()).armies.find(a=>a.id===garrison.id).slots[slot].count,1);
 await command(41,town,slot);await wait(()=>goonkMobileState.mode==='creature'&&goonkMobileState.creatureUpgrades?.length);
 const upgrade=(await state()).creatureUpgrades.find(u=>u.key==='core:halberdier');assert(upgrade);assert.deepEqual(upgrade.cost,[0,0,0,0,0,0,6,0]);assert(upgrade.affordable);
 await page().locator(`[data-upgrade="${upgrade.id}"]`)[press]();await wait(value=>goonkMobileState.resources[6]===value,paid.resources[6]-6);
 const upgraded=await state();assert.deepEqual(upgraded.resources,paid.resources.map((amount,i)=>amount-upgrade.cost[i]));
 fs.writeFileSync(path.join(output,'purchase-upgrade.json'),JSON.stringify({before:before.resources,afterRecruit:paid.resources,afterUpgrade:upgraded.resources,recruitCost:before.recruitUnit.cost,upgradeCost:upgrade.cost},null,2));
 await command(43);await wait(()=>goonkMobileState.mode==='town');assert((await state()).armies.some(a=>a.slots?.some(u=>u?.key==='core:halberdier'&&u.count===1)));
 await command(1);await wait(()=>goonkMobileState.mode==='map');
 report.purchases={recruit:true,upgrade:true,recruitCost:before.recruitUnit.cost,upgradeCost:upgrade.cost,independentPaymentAndArmyCheck:true,insufficientResourcesRejected:true,touchOrMouseWithoutKeyboard:true};
}
