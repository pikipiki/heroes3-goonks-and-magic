import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
export async function runRandomIsolation({boot,walk,panel,buy,nextDay,state,command,readCompletedNativeSave,page,report,output}){
 const legacy=!!process.env.RNG_SOURCE_SAVE;
 let save;
 if(legacy)save=[...fs.readFileSync(process.env.RNG_SOURCE_SAVE)];
 else{
  await boot({reroll:'shrine',weeklyMines:true,rngIsolation:true});await walk(2);
  const data=await panel();assert(data.offers.some(row=>row.kind===4));await page().locator('[data-mithril-close]').tap();
  save=[...await readCompletedNativeSave(page(),command,{tag:832})];fs.writeFileSync(path.join(output,'source-save.vsgm1'),Buffer.from(save));await page().close();
 }
 const branches=[];
 for(const reroll of [false,true]){
  await boot({save,reroll:'shrine',weeklyMines:false,rngIsolation:true});
  if(reroll){const shrine=(await panel()).offers.find(row=>row.kind===4);assert(shrine);await buy(shrine);}
  const checkpoints=[];
  for(let day=2;day<=15;++day){
   await nextDay();assert.equal((await state()).day,day);
   if(day===8||day===15){
    const mines=(await panel()).offers.filter(row=>row.kind===0).map(({id,resource,dailyIncome})=>({id,resource,dailyIncome})).sort((a,b)=>a.id-b.id);
    assert.equal(mines.length,14);checkpoints.push({day,mines});
   }
  }
  branches.push({reroll,checkpoints});await page().close();
 }
 fs.writeFileSync(path.join(output,'random-stream.json'),JSON.stringify(branches,null,2));
 assert.deepEqual(branches[1].checkpoints,branches[0].checkpoints,'A shrine reroll must not consume the main random stream used by weekly mines');
 report.randomIsolation={mines:14,checkpoints:[8,15],legacySave:legacy};
 report.scenarios.push(legacy?'mithril-legacy-seed-reroll-preserves-main-random-stream':'mithril-new-game-reroll-preserves-main-random-stream');
}
