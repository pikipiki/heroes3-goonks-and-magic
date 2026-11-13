/** Source breath flag3: damage reaches Goonk collateral, scripted statuses do not. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function runSulfideBreathCases({boot,combat,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339',primaryKey='core:gnoll',collateralKey='goonk:bubu';
 const layout={attacker:[19,53,87,121,155,36,70],defender:[20,21,88,122,156,37,71]};
 const fixtures=Object.fromEntries([primaryKey,collateralKey].map(k=>[k,{
  hitPoints:1000000,attack:0,defense:20,speed:1,damage:{min:1,max:1},abilities:{causalNoMorale:{type:'NO_MORALE'}}
 }]));
 await boot({artifacts:{},sulfide:{layout,fixtures},garrison:[{type:primaryKey,amount:1},{type:collateralKey,amount:1}],army:[{type:key,amount:1}]});
 await combat();await wait(k=>goonkMobileState.canAct&&goonkMobileState.activeUnit?.key===k,key);
 const before=await state(),actor=before.battleUnits.find(u=>u.key===key),primary=before.battleUnits.find(u=>u.key===primaryKey),collateral=before.battleUnits.find(u=>u.key===collateralKey);
 assert(primary.canMeleeAt);assert.equal(primary.occupied[0],20);assert.equal(collateral.occupied[0],21);
 const physical=u=>Math.floor(70*(1+0.05*Math.min(60,Math.max(0,actor.attack-u.defense))));
 const origin=before.battleCells.find(c=>c.hex===19);
 assert(origin);
 // Choose the real native attack direction. performMobileAction alone keeps
 // the last cursor origin (default upper-left), which otherwise attacks from2.
 await page().evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,0),origin);
 await page().waitForTimeout(100);
 await cmd(14,4,20);
 await wait(id=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.currentHealth<1000000,collateral.stackId);
 await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit);await page().waitForTimeout(1000);
 const after=await state(),p=after.battleUnits.find(u=>u.stackId===primary.stackId),c=after.battleUnits.find(u=>u.stackId===collateral.stackId);
 assert.equal(p.maximumHealth,450000);assert.equal(p.defense,primary.defense-3);
 assert.equal(p.maximumHealth-p.currentHealth,physical(primary)+35);
 assert.equal(c.maximumHealth,1000000,'Source75/71 CFG script targets only the original primary hex');
 assert.equal(c.defense,collateral.defense,'SpellEffect8 DEF−3 is primary-only');
 assert.equal(c.maximumHealth-c.currentHealth,physical(collateral),'Collateral receives source breath physical only, not primary ATT_DISRUPT Acid');
 assert.equal(after.battleUnits.find(u=>u.stackId===actor.stackId).attack,actor.attack,'Existing Bubu receives collateral without an invented retaliation/Weakness');
 report.sulfideBreathPrimaryScope={before,after,primaryPhysical:physical(primary),collateralPhysical:physical(collateral),acidPrimary:35,acidCollateral:0,
  fixture:'Original339R0 breath flag unchanged. Real Gnoll20 and real GoonkBubu21 retain abilities/nature; durability and physical control stats only.'};
 await page().screenshot({path:path.join(out,'sulfide339-source-breath-goonk-collateral.png')});await page().close();
 fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
}
