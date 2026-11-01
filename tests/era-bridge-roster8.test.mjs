import test from 'node:test';import assert from 'node:assert/strict';import {castleFourthAccess,readTownBuildingCost} from '../scripts/era-bridge/roster8/town-access.mjs';
test('fourth Castle upgrade retains full tier chain, third prerequisite, hall access and exact source resource order',()=>{
 const town={creatures:[[],[],[],[],[],[],['angel','archangel','supremeArchangel']],hallSlots:[[],[],[],[],[[],[],['dwellingLvl7','dwellingUpLvl7','dwellingUp2Lvl7']]],structures:{dwellingUp2Lvl7:{animation:'verified-third.def',x:303,y:0}}};
 const original=structuredClone(town),a=castleFourthAccess(town,'BuildingCost0077="0 15 0 15 15 15 30000"')['core:castle'].town;assert.deepEqual(town,original);assert.deepEqual(a.creatures[6],['angel','archangel','supremeArchangel','tum-era:cherub']);assert.equal(a.buildings.dwellingUp3Lvl7.id,57);assert.deepEqual(a.buildings.dwellingUp3Lvl7.requires,['dwellingUp2Lvl7']);assert(a.hallSlots[4][2].includes('dwellingUp3Lvl7'));assert.deepEqual(a.buildings.dwellingUp3Lvl7.cost,{wood:0,mercury:15,ore:0,sulfur:15,crystal:15,gems:15,gold:30000});assert.equal(a.structures.dwellingUp3Lvl7.animation,'verified-third.def');
});
test('Necropolis original77 cost preserves mercury30 and gold20000',()=>{
 assert.deepEqual(readTownBuildingCost('BuildingCost0077="10 30 10 0 0 0 20000"',77),{wood:10,mercury:30,ore:10,sulfur:0,crystal:0,gems:0,gold:20000});assert.throws(()=>readTownBuildingCost('BuildingCost0077="10 20"',77),/Invalid/);
});
