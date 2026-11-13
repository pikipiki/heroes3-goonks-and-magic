/** True original339 versus original339: no invented Toxic15 target actor. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export async function runSulfideToxicCases({boot,combat,state,cmd,wait,page,out,report}) {
 const key='tum-era:eraCreature339';
 const layout={attacker:[19,53,87,121,155,36,70],defender:[20,54,88,122,156,37,71]};
 for(const orb of [false,true]) {
 if(process.env.SULFIDE_ORB&&process.env.SULFIDE_ORB!==(orb?'orb':'none'))continue;
 await boot({artifacts:orb?{misc1:'core:orbOfVulnerability'}:{},sulfide:{layout},garrison:[{type:key,amount:2}],army:[{type:key,amount:1}]});
 await combat();let before;
 for(let n=0;n<200;n++) {
  const s=await state();
  if(s.canAct&&s.activeUnit?.key===key&&!s.activeUnit.enemy){before=s;break;}
  if(s.canAct)await cmd(12,s.activeStack,s.round);
  await page().waitForTimeout(100);
 }
 assert(before);
 const actor=before.battleUnits.find(u=>u.key===key&&!u.enemy);
 const target=before.battleUnits.find(u=>u.key===key&&u.enemy);
 assert.equal(actor.experienceRank,0);assert.equal(target.experienceRank,0);
 assert.equal(target.maximumHealth,850);assert.equal(target.count,2);
 assert.equal(actor.damageMin,70);assert.equal(actor.damageMax,70);assert(target.canMeleeAt);
 const advantage=actor.attack-target.defense;
 const physical=Math.floor(70*(advantage>=0?1+0.05*Math.min(60,advantage):1-Math.min(0.7,-0.025*advantage)));
 await cmd(14,4,target.occupied[0]);
 const expectedMaximum=orb?383:425;
 await wait(({id,hp})=>goonkMobileState.battleUnits.find(u=>u.stackId===id)?.maximumHealth===hp,{id:target.stackId,hp:expectedMaximum});
 await wait(()=>goonkMobileState.canAct&&goonkMobileState.activeUnit);
 await page().waitForTimeout(1000);
 const after=await state(),injured=after.battleUnits.find(u=>u.stackId===target.stackId);
 assert.equal(injured.count,2);assert.equal(injured.maximumHealth,expectedMaximum,orb?'Actual Orb negates naturalToxic71; sourceF32 Age+Poison at850HP gives383':'Toxic15 rejects Poison71 but not Age75');
 assert.equal(injured.defense,target.defense,'Source Toxic15 blocks queued80 independently of Orb');
 assert.equal(injured.maximumHealth-injured.currentHealth,physical,'Source Toxic15 blocks hardcodedAcid damage, not physical or Age');
 report['sulfideToxic339'+orb]={before,after,physical,acid:0,defenseDelta:0,expectedMaximum,orb,
  fixture:'Both source339R0 definitions and abilities unchanged; enemycount2 keeps both stacks alive for native causal observation.'};
 await page().screenshot({path:path.join(out,'sulfide339-real-toxic-target-'+orb+'.png')});
 await page().close();
 fs.writeFileSync(path.join(out,'partial-result.json'),JSON.stringify({passed:true,report},null,2));
 }
}
