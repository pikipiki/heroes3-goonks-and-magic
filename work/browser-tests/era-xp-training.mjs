/** Browser-only native training. Caller owns fixture map/data setup. */
import assert from 'node:assert/strict';
export async function trainAndEngageFromMap(page,{snapshotArray,initialClick={x:433,y:281},secondTile={x:14,y:11},timeout=240000}={}){
 const state=()=>page.evaluate(()=>goonkMobileState),wait=(fn,arg)=>page.waitForFunction(fn,arg,{timeout}),click=name=>page.getByRole('button',{name,exact:true}).click();
 const travel=async point=>{await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),point);await wait(()=>goonkMobileState.hasPath);await click('➤ Marcher');await wait(()=>goonkMobileState.mode==='battle'&&goonkMobileState.canAct&&!goonkMobileState.activeUnit?.enemy);};
 assert.equal((await state()).mode,'map');await travel(initialClick);const trainingActor=(await state()).activeStack;
 for(let i=0;i<8;i++){
  const st=await state();if(st.mode!=='battle')break;const target=st.battleUnits.find(u=>u.enemy);assert(target,'Training target required');
  if(st.activeStack===trainingActor)await page.evaluate(({x,y})=>{Module._vcmiMobilePointer(x,y,0);Module._vcmiMobilePointer(x,y,1);},target);else await click('⛨ Défendre');
  await wait(old=>goonkMobileState.mode!=='battle'||(goonkMobileState.canAct&&!goonkMobileState.activeUnit?.enemy&&(goonkMobileState.activeStack!==old.id||goonkMobileState.round>old.round)),{id:st.activeStack,round:st.round});
 }
 await wait(()=>goonkMobileState.mode!=='battle');
 for(let i=0;i<12;i++){if((await state()).mode==='map')break;await page.evaluate(()=>Module._vcmiMobileCommand(1,0,0,0,0,0));await page.waitForTimeout(250);}
 await wait(()=>goonkMobileState.mode==='map');const afterTraining=await state();
 if(snapshotArray)await page.evaluate(name=>{window[name]=[];},snapshotArray);
 const o=afterTraining.mapOverview;assert(o);const secondClick={x:o.view.x+(secondTile.x-o.viewport.x)*32,y:o.view.y+(secondTile.y-o.viewport.y)*32};
 // getTilesTotalRect floors the top-left tile; this coordinate is inside the
 // selected tile for every integer partial scroll offset0..31, unlike +16.
 await travel(secondClick);return{afterTraining,before:await state(),secondClick};
}
