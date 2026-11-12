import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import os from'node:os';import path from'node:path';import{execFileSync}from'node:child_process';
test('source Slow selector preserves c54 chance, exclusions, Orb and draw order',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-cslow-'));
 try{
  fs.writeFileSync(temporary+'/probe.cpp',`#include ${JSON.stringify(path.resolve('work/vcmi-wasm/lib/era/EraCSlowSelector.h'))}
#include <cassert>
#include <vector>
#include <utility>
int main(){using namespace era_bridge;CSlowSnapshot s;s.actorAlive=s.targetAlive=true;s.rank=10;s.targetSourceId=1;
 std::vector<std::pair<int,int>> calls;int roll=1;auto rng=[&](int lo,int hi){calls.push_back({lo,hi});return roll;};int effect=0;
 assert(selectSourceCSlow(s,rng,&effect)&&effect==0);assert(calls.size()==2);assert(calls[0]==std::make_pair(1,100)&&calls[1]==std::make_pair(1,100));
 calls.clear();s.rank=0;assert(!selectSourceCSlow(s,rng));assert(calls.empty());s.rank=10;
 calls.clear();s.targetSourceId=160;assert(!selectSourceCSlow(s,rng,&effect)&&effect==78&&calls.size()==1);
 calls.clear();s.targetSourceId=83;assert(!selectSourceCSlow(s,rng)&&calls.size()==1);s.orbOfVulnerability=true;assert(selectSourceCSlow(s,rng));
 s.targetSourceId=121;s.orbOfVulnerability=false;assert(!selectSourceCSlow(s,rng));s.targetSourceId=30;assert(selectSourceCSlow(s,rng)); //No ALIVE, UNDEAD or MIND category rejection.
 calls.clear();s.mirrorActive=true;s.mirrorThreshold=20;assert(!selectSourceCSlow(s,rng,&effect)&&effect==3&&calls.size()==2&&calls[1]==std::make_pair(1,50));s.mirrorActive=false;
 s.alreadySlowed=true;calls.clear();assert(!selectSourceCSlow(s,rng)&&calls.size()==1);s.alreadySlowed=false;
 s.negativeExperienceImmunity=true;calls.clear();assert(!selectSourceCSlow(s,rng,&effect)&&effect==78&&calls.size()==3);s.orbOfVulnerability=true;assert(selectSourceCSlow(s,rng));
 s.artifact134=true;assert(!selectSourceCSlow(s,rng));s.artifact134=false;s.negativeExperienceImmunity=false;s.orbOfVulnerability=false;
 assert(sourceCSlowRacialResistance(16)==20&&sourceCSlowRacialResistance(17)==40&&sourceCSlowRacialResistance(133)==20&&sourceCSlowRacialResistance(196)==20&&sourceCSlowRacialResistance(24)==0);
 s.targetSourceId=17;s.heroResistance=10;s.creatureResistance=20;roll=30;assert(!selectSourceCSlow(s,rng)); //Proc success at30; total resistance70.
 s.rank=10;roll=31;calls.clear();assert(!selectSourceCSlow(s,rng)&&calls.size()==1);
}`);
  execFileSync(process.env.CXX||'c++',['-std=c++17','-fsanitize=undefined','-fno-sanitize-recover=all',temporary+'/probe.cpp','-o',temporary+'/probe']);execFileSync(temporary+'/probe');
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
test('source chain uses ordered accuracy, truncated pixel distance, halving and friendly termination',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-chain4-'));
 try{
 fs.writeFileSync(temporary+'/probe.cpp',`#include ${JSON.stringify(path.resolve('work/vcmi-wasm/lib/era/EraDungeonChainPlan.h'))}
#include <cassert>
int main(){using namespace era_bridge;DungeonChainCandidate origin{0,1,0,0};
 std::vector<DungeonChainCandidate> candidates{{1,1,10,4},{2,1,10,1},{3,0,2,1},{4,1,50,0}};std::vector<uint32_t> calls;
 auto accuracy=[&](const DungeonChainCandidate & c){calls.push_back(c.id);return c.id!=3;};
 auto next=dungeonChainNext(origin,candidates,{0},accuracy);assert(next&&next->id==1); //sqrt116 and101 both truncate10; first slot wins.
 assert((calls==std::vector<uint32_t>{1,2,3,4})); //Every candidate visited, even farther and rejected candidates.
 calls.clear();next=dungeonChainNext(origin,candidates,{0,1},accuracy);assert(next&&next->id==2);assert((calls==std::vector<uint32_t>{2,3,4}));
 next=dungeonChainNext(origin,candidates,{0},[](const auto &){return true;});assert(next->id==3);assert(!dungeonChainContinues(origin,*next)); //Do not skip friend and find another enemy.
 assert(dungeonChainContinues(origin,candidates[0]));assert(dungeonChainHalf(25)==12&&dungeonChainHalf(12)==6&&dungeonChainHalf(1)==0);assert(dungeonChainHalf(-3)==-2&&dungeonChainHalf(-1)==-1);assert(dungeonChainRaw(50000000u,50u)==-1794967296);assert(dungeonChainAdd(2147483647,1)==(-2147483647-1));assert(dungeonChainAdd(-2147483647-1,-1)==2147483647);
 static_assert(dungeonChainUndefinedSecondPassDamage==0);
}`);
 execFileSync(process.env.CXX||'c++',['-std=c++17','-fsanitize=undefined','-fno-sanitize-recover=all',temporary+'/probe.cpp','-o',temporary+'/probe']);execFileSync(temporary+'/probe');
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
test('Dungeon opt-in binds scoped CFG and guards altered original fields',async()=>{
 const {compileCreatureProperties}=await import('../scripts/era-bridge/creatures/creature-properties.mjs');
 const {reviewedDungeon,SOURCE_DUNGEON_CONTRACT}=await import('../scripts/era-bridge/roster8/dungeon-source.mjs');
 const cfg='Flags=2069\nLevel=6\nTown=5\nUpgradesTo=352\nSharpshooters=1\nShootingRayColor=10092543\n';
 const options={sourceCreatureId:351,nativeDungeonContract:SOURCE_DUNGEON_CONTRACT,nativeBiologyContract:'source-biological-flags-v1',nativeExperienceProfile:true,freshDefinition:true,analyseOnly:true,resolveTown:()=> 'core:dungeon',resolveCreature:id=>'tum-era:eraCreature'+id};
 const result=compileCreatureProperties(cfg,options);assert.equal(result.policies.length,0);assert.equal(result.definition.abilities.sourceSharpshooter.type,'NO_DISTANCE_PENALTY');assert.equal(result.definition.abilities.amethyst_flag_11.type,'NO_WALL_PENALTY');assert.equal(Object.values(result.definition.abilities).some(b=>b.type==='NO_MELEE_PENALTY'),false);assert.equal(result.definition.doubleWide,true);
 assert.deepEqual(result.definition.graphics.missile.ray,Array.from({length:5},()=>({start:[255,255,255,255],end:[255,255,255,255]})));
 assert.throws(()=>reviewedDungeon(cfg.replace('10092543','10092542'),{sourceId:351,contract:SOURCE_DUNGEON_CONTRACT}));
 const priestess=reviewedDungeon('Flags=21\nLevel=6\nTown=5\nCreatureSpellPowerMultiplier=0\nShot type=4',{sourceId:352,contract:SOURCE_DUNGEON_CONTRACT});assert.deepEqual(priestess.consumedKeys,['CreatureSpellPowerMultiplier','Shot type']);assert.equal(priestess.source.chain.complete,false);
});
test('original DEF crop geometry is bounded and participates in pixel nearest selection',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-chain-def-'));
 try{fs.writeFileSync(temporary+'/probe.cpp',`#include ${JSON.stringify(path.resolve('work/vcmi-wasm/lib/era/EraDungeonSpriteGeometry.h'))}
#include <vector>
#include <cassert>
int main(){using namespace era_bridge;std::vector<uint8_t>b(1000);auto put=[&](size_t o,uint32_t n){for(int i=0;i<4;i++)b[o+i]=uint8_t(n>>(8*i));};put(12,1);put(788,1);put(813,900);put(928,204);assert(dungeonFirstDefTop(b.data(),b.size())==204);assert(!dungeonFirstDefTop(b.data(),813));put(813,999);assert(!dungeonFirstDefTop(b.data(),b.size()));put(813,900);put(928,5000);assert(!dungeonFirstDefTop(b.data(),b.size()));assert(dungeonSpriteCentreX(13,6,true,false)==572);assert(dungeonSpriteCentreX(13,6,true,true)==616);assert(dungeonSpriteCentreY(6,204)==221);assert(dungeonSpriteCentreY(6,145)==191);assert(dungeonSpriteCentreY(6,204)-dungeonSpriteCentreY(6,145)==30);}`);
 execFileSync(process.env.CXX||'c++',['-std=c++17','-fsanitize=undefined','-fno-sanitize-recover=all',temporary+'/probe.cpp','-o',temporary+'/probe']);execFileSync(temporary+'/probe');
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
