import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import {sourceAdventureFearAura,sourceAdventureFearRank8} from'../scripts/era-bridge/objects/source-fear-aura.mjs';
test('new Fear actors use the already published native aura contract, including rank8 gating',()=>{
 const published=JSON.parse(fs.readFileSync('mod/tum-era/content/config/source-ghost-fear-rank5.json'));
 const old=Object.values(published).flatMap(v=>v.stackExperience??[]).find(r=>r.bonus?.stacking==='eraSourceFear:156:v1').bonus;
 for(const id of[253,306,330])assert.deepEqual(sourceAdventureFearAura(id),{...old,stacking:`eraSourceFear:${id}:v1`});
 const row=sourceAdventureFearRank8({bonus:{type:'FEARFUL',valueType:'ADDITIVE_VALUE'},values:[0,0,0,0,0,0,0,1,1,1]});
 assert.deepEqual(row.values,[false,false,false,false,false,false,false,true,true,true]);
 assert.equal(row.bonus.val,10);assert.equal(row.bonus.valueType,'INDEPENDENT_MAX');
 assert.equal(row.bonus.propagator,'BATTLE_WIDE');
 assert.throws(()=>sourceAdventureFearAura(252));
 assert.throws(()=>sourceAdventureFearRank8({...row,values:Array(10).fill(1)}));
});
