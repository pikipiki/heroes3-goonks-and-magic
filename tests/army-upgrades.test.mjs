import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {armyUpgradeAffordable} from '../web/army-upgrades.mjs';
test('Maximum army evolution follows all stages, totals costs and stops at cycles',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-upgrades-'));try{const bin=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined','tests/native/ArmyUpgradePath.test.cpp','-o',bin]);execFileSync(bin);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('Bulk confirmation requires the complete cumulative budget including rare resources',()=>{const quote={units:[{id:4,count:10}],cost:[0,0,0,0,6,0,60,0]};assert(armyUpgradeAffordable(quote,[0,0,0,0,6,0,60,0]));assert(!armyUpgradeAffordable(quote,[0,0,0,0,5,0,999999,0]));assert(!armyUpgradeAffordable(quote,[0,0,0,0,9,0,59,0]));assert(!armyUpgradeAffordable({units:[],cost:[]}));assert(!armyUpgradeAffordable(null));});
test('Empty upgrade quotes explain the exact town requirement in the selected language',async()=>{
 const {armyUpgradeUnavailableMessage:message}=await import('../web/army-upgrades.mjs');
 assert.match(message({unavailableReason:'noTown'},'fr'),/aucun château/);
 assert.match(message({unavailableReason:'noTown'},'en'),/not in a town/);
 assert.match(message({unavailableReason:'wrongTown'},'fr'),/château de leur faction/);
 assert.match(message({unavailableReason:'wrongTown'},'en'),/town of their faction/);
 assert.match(message({unavailableReason:'requiredBuilding'},'fr'),/ne sont pas construits/);
 assert.match(message({unavailableReason:'noEvolution'},'en'),/no further/);
 assert.equal(message({},'fr'),'Aucune amélioration disponible ici.');
});
