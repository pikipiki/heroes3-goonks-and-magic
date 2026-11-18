import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
export async function runMithrilOptions({boot,panel,buy,state,command,wait,page,output,report,readCompletedNativeSave}){
 const inspect=async active=>{
  assert.equal(await page().locator('button[data-mithril-open]').isVisible(),active,'Mithril follows native saved setting');
  if(active){const data=await panel();assert(data.offers.some(row=>row.kind===0),'Native mine offers remain present');return data;}
  return null;
 };
 const save=async name=>{
  const bytes=await readCompletedNativeSave(page(),command);
  fs.writeFileSync(path.join(output,name),Buffer.from(bytes));return [...bytes];
 };
 const mode=process.env.CASES;
 if(mode==='options-legacy-producer'){
  for(const enabled of [false,true]){
   await boot({enabled});await inspect(enabled);
   await save(`old-six-options-${enabled?'on':'off'}.vsgm1`);
   report.scenarios.push(`original-six-options-save-${enabled}`);await page().close();
  }
  return;
 }
 if(mode==='options-legacy-consumer'){
  assert(process.env.MITHRIL_LEGACY_DIR);
  for(const enabled of [false,true]){
   const file=process.env.MITHRIL_LEGACY_VECTOR?`extended-${enabled?'false-1':'true-0'}.vsgm1`:process.env.MITHRIL_LEGACY_SEVEN?`extended-false-${enabled?1:-1}.vsgm1`:`old-six-options-${enabled?'on':'off'}.vsgm1`;
   const bytes=[...fs.readFileSync(path.join(process.env.MITHRIL_LEGACY_DIR,file))];
   await boot({save:bytes,enabled:!enabled});const data=await inspect(enabled);
   if((process.env.MITHRIL_LEGACY_SEVEN||process.env.MITHRIL_LEGACY_VECTOR)&&enabled){assert.equal(data.amount,93);assert(data.offers.some(row=>row.kind===0&&row.active&&row.dailyIncome===2000),'Old purchased mine and payment survive');}
   report.scenarios.push(`original-${process.env.MITHRIL_LEGACY_VECTOR?'vector13':process.env.MITHRIL_LEGACY_SEVEN?'seven':'six'}-options-load-frozen-${enabled}`);await page().close();
  }
  return;
 }
 const matrix=mode==='options-desktop'?[[false,1,true],[true,0,false]]:
  [[false,-1,false],[true,-1,true],[false,1,true],[true,0,false],[false,0,false],[true,1,true]];
 for(const [enabled,wogChoice,active] of matrix){
  await boot({enabled,wogChoice});let before=await inspect(active);
  if(active){
   const mine=before.offers.find(row=>row.kind===0&&row.cost===7);await buy(mine);
   before=(await state()).mithril;assert.equal(before.amount,93);assert(before.offers.find(row=>row.id===mine.id).active);
  }
  const bytes=await save(`extended-${enabled}-${wogChoice}.vsgm1`);
  await page().close();await boot({save:bytes,enabled:!enabled});
  assert.equal(await page().locator('.wog-options').isVisible(),false,'Loaded game cannot change options');
  assert.equal(await page().locator('button[data-mithril-open]').isVisible(),active,'Reload ignores changed module defaults');
  if(active){const loaded=await panel();assert.equal(loaded.amount,before.amount);assert.deepEqual(loaded.offers,before.offers);}
  else {await command(1200,0,7,0);await page().waitForTimeout(200);assert.equal((await state()).resources[7],100,'Disabled server rejects direct purchase');}
  report.scenarios.push({globalModule:enabled,choice:wogChoice,active,purchase:active,saveReload:true,input:mode==='options-desktop'?'mouse':'touch'});
  await page().close();
 }
}
