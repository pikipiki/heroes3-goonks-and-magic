import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('Seminarium keeps four coherent source waves and original fourth-state fallback',()=>{
 const manifest=JSON.parse(fs.readFileSync('mod/tum-era/mod.json'));assert(manifest.objects.includes('config/objects/bank45.json'));
 const bank=JSON.parse(fs.readFileSync('mod/tum-era/content/config/objects/bank45.json'))['core:creatureBank'].types.eraBank45;
 assert.equal(bank.visitMode,'once');assert.equal(bank.selectMode,'selectFirst');assert.equal(bank.rewards.length,4);
 for(const[index,r]of bank.rewards.entries()){
  assert.equal(r.mapDice,index);assert.deepEqual(r.appearChance,{min:index*25,max:(index+1)*25});
  assert.equal(r.guards.length,5);for(const[slot,g]of r.guards.entries()){
   assert.equal(g.type,'core:swordsman');assert.equal(g.amount,[10,20,30,50][index]);
   assert.equal(g.upgradeChance??0,index===3&&slot===0?7:0);
  }
  assert.deepEqual(r.creatures,[{type:'tum-era:eraCreature269',amount:(index+1)*2}]);
  assert.equal(r.resources,undefined);assert.equal(r.artifacts,undefined);
 }
 assert.deepEqual(bank.sounds,{ambient:['tum-era/objects/SEMINARIUMLOOP.wav']});
 assert.equal(bank.templates.base0.animation,'tum-era/objects/CB13.def');
});
