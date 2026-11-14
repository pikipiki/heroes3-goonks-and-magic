import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {DWELLING_CLOSURE,prepareDwellingCandidates} from '../scripts/era-bridge/objects/stage-dwelling-closure.mjs';
import {compileDwellingServices} from '../scripts/era-bridge/objects/source-dwelling-services.mjs';
import {validateRuntimePolicy} from '../scripts/era-bridge/runtime-policy.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(project,'../Third-Upgrade-Mod-Full');
const available=fs.existsSync(path.join(source,'Data/AmeCre.pac'));
test('whole dwelling closure includes all original targets and upgrade dependencies',()=>{
 assert.equal(DWELLING_CLOSURE.length,54);assert.equal(new Set(DWELLING_CLOSURE).size,54);
 for(const id of[200,239,305,334,360,362])assert.ok(DWELLING_CLOSURE.includes(id));
});
test('source dwelling services require exact source actors and retain scoped runtime laws',{skip:!available},()=>{
 const get=id=>fs.readFileSync(path.join(source,'Data/Creatures',id+'.cfg'),'utf8');
 const fields=t=>Object.fromEntries(t.trim().split(/\r?\n/).map(s=>s.split('=').map(v=>v.trim())).map(([k,v])=>[k,Number(v)]));
 for(const id of[262,264,270,276,279,284,296,303,306,312,313,314,316,317,323,333,334,360]){
  const text=get(id),definition={abilities:{}},target='tum-era:eraCreature'+id;
  const service=compileDwellingServices(id,text,fields(text),target,definition);
  validateRuntimePolicy({schemaVersion:1,creatures:{[target]:service.runtime}});
  assert.throws(()=>compileDwellingServices(id,text+'\n',fields(text),target,{abilities:{}}),/Changed dwelling/);
  if([333,334,360].includes(id))assert.deepEqual(definition.abilities.sourceTeleportMovement,{type:'FLYING',subtype:'movementTeleporting'});
  if([262,264].includes(id)){assert.equal(definition.abilities.sourceFixedEnchantmentDuration.val,6);assert.equal(service.pending[0].code,'native-caster-target-proof-required');}
  if([279,334].includes(id))assert.equal(service.pending[0].code,'native-demonology-proof-required');
  if(id===303)assert.deepEqual(service.runtime.dailyResources,{resource:'core:gold',amount:0,goldPerCreature:25});
  if(id===306){const fear=definition.abilities.sourceFear;assert.equal(fear.val,10);assert.equal(fear.valueType,'INDEPENDENT_MAX');assert.equal(fear.propagator,'BATTLE_WIDE');assert.equal(fear.propagationUpdater,'BONUS_OWNER_UPDATER');assert.equal(fear.limiters[0],'OPPOSITE_SIDE');}
  if(id===296)assert.deepEqual(service.runtime.rebirth,{chance:1,fraction:.3,guaranteedFraction:.5});
 }
});
test('all 44 non-bank actors are staged with exact assets and unresolved gates',{skip:!available},async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-dwelling-test-'));
 try{
  const result=await prepareDwellingCandidates({projectRoot:project,sourceRoot:source,outputRoot:output});
  assert.equal(result.actors,44);
  const review=JSON.parse(fs.readFileSync(path.join(output,'dwelling-closure-review.json')));
  const defs=JSON.parse(fs.readFileSync(path.join(output,'content/config/source-dwelling-actors.candidate.json')));
  assert.equal(review.activated,false);assert.equal(review.activationReady,false);
  for(const id of[200,239,276,277,284,285,292,296,298,303,306,307,308,311,313,314,315,316,319,322,323,325,326,327,328,362])assert.ok(review.candidateIds.includes(id),'Locally closed source '+id);
  assert.equal(Object.keys(defs).length,44);
  for(const id of [309,310]){const rows=defs['eraCreature'+id].stackExperience.filter(r=>r.bonus.stacking==='sourceDwellingFlatHealth:v1');assert.equal(rows.length,10,'One disjoint absolute H+ carrier per positive rank');for(const row of rows)assert(row.values.every(v=>typeof v==='boolean'));for(let rank=1;rank<=10;rank++){const active=rows.filter(r=>r.values[rank-1]);assert.equal(active.length,1);assert.equal(active[0].bonus.val,[0,1,2,4,5,7,8,10,11,13,14][rank]);}}
  const demonSpells=JSON.parse(fs.readFileSync(path.join(output,'content/config/source-dwelling-spells.candidate.json')));
  assert.equal(demonSpells.sourceDwellingDemonology315.levels.base.battleEffects.demonSummon.id,'tum-era:eraCreature315');
  assert.equal(demonSpells.sourceDwellingDemonology60.levels.base.battleEffects.demonSummon.id,'core:wight');
  assert.equal(demonSpells.sourceDwellingDemonology60.levels.base.battleEffects.demonSummon.eraDemonology,true);
  assert.ok(!defs.eraCreature253);assert.ok(!review.candidateIds.includes(304));
  assert.deepEqual(defs.eraCreature304.upgrades,['tum-era:eraCreature305']);
  assert.deepEqual(defs.eraCreature305.advMapAmount,{min:16,max:25});
  assert.ok(review.actors.find(a=>a.sourceId===305).obligations.some(o=>o.code==='source-exception-native-validation'));
  assert.ok(review.actors.find(a=>a.sourceId===325).services.some(e=>e.native==='EraDwellingGhost.h'));
  assert.ok(review.actors.find(a=>a.sourceId===325).services.some(e=>e.effective?.sourceLine===1682));
  for(const asset of review.assets)assert.equal(fs.statSync(path.join(output,asset.file)).size,asset.bytes);
  await assert.rejects(prepareDwellingCandidates({projectRoot:project,sourceRoot:source,outputRoot:output}),/fresh isolated/);
 }finally{fs.rmSync(output,{recursive:true,force:true});}
});

test('native dwelling health/Ghost arithmetic and source summon rounding pass UBSan',()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-dwelling-native-'));
 try{
 const header=f=>JSON.stringify(path.join(project,'work/vcmi-wasm/lib/era',f));
 const code=`#include ${header('EraDwellingRule.h')}
#include ${header('EraSourceRoundTwoSummon.h')}
#include ${header('EraCreatureArtifactRuntime.h')}
#include <cassert>
int main(){using namespace era_bridge;
assert(sourceDwellingFlatHealth(101,14)==115);
assert(dwellingDragonFlatDamage(true,false,false,true)==100);
assert(dwellingDragonFlatDamage(false,true,true,false)==-50);
assert(dwellingDragonFlatDamage(true,true,true,true)==50);
assert(sourceDwellingFlatHealth(16777216,1)==16777216);
assert(sourceGhost325Healing(200,1000,0,1,150,1,150)==1);
assert(sourceGhost325Healing(40000,100000,0,1,150,1,150)==150);
assert(sourceGhost325Healing(40000,100000,0,1,100,1,150)==200);
assert(sourceGhost325Healing(40000,10,0,1,100,1,150)==10);
assert(sourceGhost325Healing(199,100000,0,1,150,1,150)==0);
assert(sourceGhost325Healing(40000,100000,145,1,150,1,150)==0);
assert(sourceGhost325Healing(40000,100000,159,1,150,1,150)==0);
assert(sourceGhost325Healing(2147483647,100000,0,1,150,1,150)==0);
assert(sourceGhostTargetPercent(325)==100);
assert(sourceGhostTargetPercent(255)==100);
assert(sourceRoundTwoSummonCount(25,2)==1);
assert(sourceRoundTwoSummonCount(24,2)==0);
assert(sourcePitMasterSummonPositions(90,false,true)[0]==92);
assert(originalArmyHasMimic(true,{{1,90},{0,123}},90));
assert(!originalArmyHasMimic(true,{{1,90},{0,123}},123));
assert(!originalArmyHasMimic(false,{{1,90}},90));
}`;
 const sourceFile=path.join(output,'rule.cpp'),binary=path.join(output,'rule');fs.writeFileSync(sourceFile,code);
 execFileSync('clang++',['-std=c++17','-Wall','-Wextra','-Werror','-fsanitize=undefined,float-cast-overflow',sourceFile,'-o',binary],{stdio:'pipe'});
 execFileSync(binary,[],{stdio:'pipe'});
 }finally{fs.rmSync(output,{recursive:true,force:true});}
});
test('new artifact mimic contracts reject source/target substitution',()=>{
 validateRuntimePolicy({schemaVersion:1,creatures:{'tum-era:eraCreature311':{artifactMimic:{artifact:90}},'tum-era:eraCreature288':{artifactMimic:{artifact:123}}}});
 for(const[actor,artifact]of[[311,123],[288,90],[310,90]])assert.throws(()=>validateRuntimePolicy({schemaVersion:1,creatures:{['tum-era:eraCreature'+actor]:{artifactMimic:{artifact}}}}),/Invalid native/);
});
