import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {readSourceEighthTown,compileEighthTownAccess,EIGHTH_TOWNS} from '../scripts/era-bridge/roster8/eighth-town-access.mjs';
import {classifySourceInanimateBiology,SOURCE_INANIMATE_BIOLOGY_CONTRACT} from '../scripts/era-bridge/roster8/source-biology.mjs';
import {compileCreatureProperties} from '../scripts/era-bridge/creatures/creature-properties.mjs';
import {parseJsonc} from '../scripts/era-bridge/artifacts/importer.mjs';

const script=Array.from({length:9},(_,i)=>`!!UN:T${i}/7/0/${269+i};`).join('\n');
const cfg=i=>`BuildingName0088="Dwelling ${i}"\nBuildingName0089="Upgrade ${i}"\nBuildingDesc0088="Base recruitment"\nBuildingDesc0089="Upgraded recruitment"\nBuildingCost0088="15 0 15 0 10 0 8000"\nBuildingCost0089="20 0 20 0 15 0 10000"\nBuildingDeps0088="35 -1"\ntown_guardian=${278+i}\nlevel_7_creatures="${269+i} ${278+i} -1 -1"`;
const records=()=>EIGHTH_TOWNS.map((_,townIndex)=>readSourceEighthTown(cfg(townIndex),{townIndex,script}));
const baselineTowns=Object.fromEntries(EIGHTH_TOWNS.map(n=>['core:'+n,{creatures:Array.from({length:7},(_,i)=>['core:existing'+i]),hallSlots:Array.from({length:5},()=>[['a'],['b'],['c']]),buildings:{}}]));
const actorContracts=Object.fromEntries(Array.from({length:18},(_,i)=>[269+i,{nativeId:'tum-era:source'+(269+i),complete:true,nativeValidated:true}]));
const halls=Object.fromEntries(EIGHTH_TOWNS.map(n=>['core:'+n,{animation:'tum-era/source-'+n+'-hall',sourceFrames:{150:88,151:89}}]));

test('source eighth recruitment uses town variants and native150/151 without altering the seven existing tiers',()=>{
 const compiled=compileEighthTownAccess(records(),{enabled:true,baselineTowns,actorContracts,halls});
 for(const record of records()){
  const town=compiled.patch[record.town].town;
  assert.deepEqual(town.creatures.slice(0,7),baselineTowns[record.town].creatures);
  assert.equal(town.creatures.length,8);
  assert.equal(town.hallSlots.length,5);assert.equal(town.hallSlots[4].length,4);
  assert.equal(town.buildings.dwellingLvl8.id,150);assert.equal(town.buildings.dwellingUpLvl8.id,151);
  assert.deepEqual(town.buildings.dwellingLvl8.requires,['dwellingLvl6']);
  assert.equal(town.buildings.dwellingUpLvl8.upgrades,'dwellingLvl8');
  assert.equal(town.buildings.dwellingLvl8.cost.crystal,10);assert.equal(town.buildings.dwellingLvl8.cost.gold,8000);
 }
});

test('atomic source option rejects incomplete actors, missing original icons and ambiguous rosters',()=>{
 assert.deepEqual(compileEighthTownAccess(records(),{enabled:false}).patch,{});
 assert.throws(()=>compileEighthTownAccess(records(),{}),/Explicit/);
 const duplicate=records();duplicate[1].roster[0]=duplicate[0].roster[0];assert.throws(()=>compileEighthTownAccess(duplicate,{enabled:true,baselineTowns,actorContracts,halls}),/eighteen.*distinct/);
 const incomplete=structuredClone(actorContracts);incomplete[278].nativeValidated=false;
 assert.throws(()=>compileEighthTownAccess(records(),{enabled:true,baselineTowns,actorContracts:incomplete,halls}),/Incomplete eighth creature contract 278/);
 const wrongHalls=structuredClone(halls);wrongHalls['core:castle'].sourceFrames[150]=44;
 assert.throws(()=>compileEighthTownAccess(records(),{enabled:true,baselineTowns,actorContracts,halls:wrongHalls}),/Exact source hall/);
 assert.throws(()=>readSourceEighthTown(cfg(0).replace('269 278','269 269'),{townIndex:0,script}),/Complete original/);
 assert.throws(()=>readSourceEighthTown(cfg(0),{townIndex:0,script:script.replace('/7/0/269','/7/0/270')}),/disagrees/);
});

test('source inanimate nature keeps morale and mental flags independent and preserves the prior contract',()=>{
 for(const mask of[524290,524291,137]){
  const category=classifySourceInanimateBiology(mask);assert.equal(category.nature,'ERA_SOURCE_INANIMATE');assert.equal(category.closed,true);
  const old=compileCreatureProperties(`Flags=${mask}`,{freshDefinition:true,analyseOnly:true,nativeBiologyContract:'source-biological-flags-v1'});
  assert(old.policies.some(p=>p.kind==='era-creature-flag-semantics'));
  const current=compileCreatureProperties(`Flags=${mask}`,{freshDefinition:true,analyseOnly:true,nativeBiologyContract:SOURCE_INANIMATE_BIOLOGY_CONTRACT});
  assert(!current.policies.some(p=>p.kind==='era-creature-flag-semantics'));
  const types=Object.values(current.definition.abilities).map(b=>b.type);
  assert(types.includes('ERA_SOURCE_INANIMATE'));assert(!types.includes('LIVING'));assert(!types.includes('NON_LIVING'));assert(!types.includes('MIND_IMMUNITY'));assert(!types.includes('NO_MORALE'));
 }
 const native=parseJsonc(fs.readFileSync('work/vcmi-wasm/config/bonuses.json','utf8'));
 assert.equal(native.ERA_SOURCE_INANIMATE.creatureNature,true);assert.equal(native.ERA_SOURCE_INANIMATE.hidden,true);
 const normal=parseJsonc(fs.readFileSync('work/vcmi-wasm/config/spells/other.json','utf8'));
 assert.equal(normal.resurrection.targetCondition.noneOf['bonus.ERA_SOURCE_INANIMATE'],'absolute');
 assert.equal(normal.sacrifice.targetCondition.noneOf['bonus.ERA_SOURCE_INANIMATE'],'absolute');
 const vcmiAbility=parseJsonc(fs.readFileSync('work/vcmi-wasm/config/spells/vcmiAbility.json','utf8'));
 assert.equal(vcmiAbility.summonDemons.targetCondition.noneOf['bonus.ERA_SOURCE_INANIMATE'],'absolute');
 const ability=parseJsonc(fs.readFileSync('work/vcmi-wasm/config/spells/ability.json','utf8'));
 assert.equal(ability.poison.targetCondition.noneOf['bonus.ERA_SOURCE_INANIMATE'],'absolute');
 assert.equal(ability.deathStare.targetCondition.noneOf['bonus.ERA_SOURCE_INANIMATE'],'absolute');
 assert.equal(ability.age.targetCondition.noneOf['bonus.ERA_SOURCE_INANIMATE'],undefined);
 assert.equal(ability.disease.targetCondition.noneOf['bonus.ERA_SOURCE_INANIMATE'],undefined);
 const shooter=compileCreatureProperties('Flags=2069',{freshDefinition:true,analyseOnly:true,nativeBiologyContract:SOURCE_INANIMATE_BIOLOGY_CONTRACT});
 assert.equal(shooter.definition.abilities.amethyst_flag_11.type,'NO_WALL_PENALTY');
 assert(!shooter.policies.some(p=>p.kind==='era-creature-flag-semantics'));
});

test('real original town rosters preserve the Fortress354 recruitment upgrade despite353 CFG self-upgrade',{skip:!process.env.TUM_SOURCE},()=>{
 const root=process.env.TUM_SOURCE,script=fs.readFileSync(root+'/Data/s/Third Upgrade Mod.erm','utf8');
 const records=EIGHTH_TOWNS.map((_,townIndex)=>readSourceEighthTown(fs.readFileSync(root+'/Data/Towns/'+townIndex+'.cfg','utf8'),{townIndex,script}));
 assert.deepEqual(records.map(r=>r.roster.slice(0,2)),[[269,278],[349,350],[271,280],[337,338],[331,332],[351,352],[275,283],[353,354],[355,356]]);
 assert.equal(records[6].buildings[0].name,'Ziggurat');assert.equal(records[7].guardian,354);
 assert(/UpgradesTo=353/.test(fs.readFileSync(root+'/Data/Creatures/353.cfg','utf8')));
});
