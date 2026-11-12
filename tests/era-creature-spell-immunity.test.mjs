import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {reviewedStronghold,SOURCE_STRONGHOLD_CONTRACT} from '../scripts/era-bridge/roster8/stronghold-source.mjs';
import {parseCreatureExperience,compileCreatureExperience} from '../scripts/era-bridge/creatures/crexpbon.mjs';

test('deferred source HATE keeps exact rank percentages without creating an unported target',()=>{
 const installedRows=parseCreatureExperience(fs.readFileSync('mod/wake-of-gods/Mods/stackExperience/Content/data/crexpbon.txt','latin1'));
 for(const sourceId of [275,283])for(const target of [274,282]){
  const row={creature:sourceId,code:'h',modifier:'#'+target,values:Array.from({length:11},(_,i)=>i*2),source:'source-test',line:1};
  const rows=[...installedRows.filter(r=>r.creature<0),row];
  const options={creatureId:sourceId,installedRows,rankZero:'intrinsic',nativeExperienceProfile:true,experienceStronghold:SOURCE_STRONGHOLD_CONTRACT};
  const result=compileCreatureExperience(rows,options);assert.equal(result.ok,true);
  assert.deepEqual(result.definition.stackExperience,[{bonus:{type:'HATE',addInfo:{contract:SOURCE_STRONGHOLD_CONTRACT,sourceCreatureId:target},valueType:'ADDITIVE_VALUE'},values:Array.from({length:10},(_,i)=>(i+1)*20)}]);
  assert.equal(compileCreatureExperience(rows,{...options,experienceStronghold:undefined}).ok,false);
  const changed=structuredClone(rows);changed.at(-1).values[10]=19;
  assert.equal(compileCreatureExperience(changed,options).ok,false);
 }
});

test('whole Stronghold opt-in rejects unsupported actors, fields and inferred unupgraded immunity',()=>{
 const first='Flags=19\nLevel=5\nTown=6\nUpgradesTo=283\n',last='Flags=19\nLevel=5\nTown=6\n';
 const options={contract:SOURCE_STRONGHOLD_CONTRACT};
 assert.equal(reviewedStronghold(first,{...options,sourceId:275}).immuneToSourceCreatureEvents,false);
 const upgraded=reviewedStronghold(last,{...options,sourceId:283});
 assert.equal(upgraded.postActionCleanse.length,15);assert.equal(upgraded.sourceOnlyDamageOrigins.length,7);
 for(const sourceId of [274,276,282,284])assert.throws(()=>reviewedStronghold(last,{...options,sourceId}));
 assert.throws(()=>reviewedStronghold(last,{sourceId:283}));
 for(const changed of [last+'Flags=19\n',last+'Spell 1=2\n',last.replace('19','23')])assert.throws(()=>reviewedStronghold(changed,{...options,sourceId:283}));
});

test('source creature immunity distinguishes damage origins, primary targets and post-action cleansing',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-source-immunity-'));
 try{
  fs.writeFileSync(dir+'/probe.cpp',`#include "${path.resolve('work/vcmi-wasm/lib/era/EraCreatureSpellImmunity.h')}"
   #include "${path.resolve('work/vcmi-wasm/lib/era/EraSourceHate.h')}"
   #include <cassert>
   int main(){using namespace era_bridge;using O=CreatureSpellDamageOrigin;
    for(int id:{283,346,347}){
     assert(sourceCreatureSpellImmune(id));
     for(auto origin:{O::DeathStare,O::FireShield,O::Acid,O::Thunder,O::DeathRipple})
      assert(cancelsCreatureSpellDamage(id,origin,true));
     for(auto origin:{O::DeathCloud,O::Fireball}){
      assert(cancelsCreatureSpellDamage(id,origin,false));
      assert(!cancelsCreatureSpellDamage(id,origin,true));
     }
     assert(!cancelsCreatureSpellDamage(id,O::Other));
    }
    for(int id:{-1,0,132,133,275,282,284,345,348}){
     assert(!sourceCreatureSpellImmune(id));
     for(int origin=0;origin<=7;origin++)assert(!cancelsCreatureSpellDamage(id,static_cast<O>(origin)));
    }
    for(int spell=0;spell<85;spell++){
     bool expected=false;for(int id:{42,52,45,54,50,62,59,60,61,70,71,72,73,74,75})expected|=spell==id;
     assert(cleansesCreatureSpell(spell)==expected);
    }
    for(int attacker=0;attacker<400;attacker++)for(int target=0;target<400;target++)
     assert(sourceStrongholdHatePair(attacker,target)==((attacker==275||attacker==283)&&(target==274||target==282)));
   }`);
  execFileSync('c++',['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=undefined',dir+'/probe.cpp','-o',dir+'/probe']);
  execFileSync(dir+'/probe');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('retained source distinguishes Quetzalcoatl from its unupgraded Stronghold creature',()=>{
 const source=fs.readFileSync('outputs/wog-priorities-0.4.147/stronghold-source/source-creature-spell-immunity.erm','utf8');
 const ids=[...source.matchAll(/tum_RemoveSpellFromStack\):Pi\/(\d+)/g)].map(m=>Number(m[1]));
 assert.deepEqual([...new Set(ids)],[42,52,45,54,50,62,59,60,61,70,71,72,73,74,75]);
 assert.equal(ids.filter(n=>n===52).length,2);
 assert.match(source,/MON_QUETZALCOUATL/);
 assert.doesNotMatch(source,/MON_COATL/);
 assert.match(source,/!?FU\(OnBattleActionEnd\)/);
});
