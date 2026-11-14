import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('source vampire drain heals a reborn clone and restores its fragile flag',()=>{
 const source=fs.readFileSync('work/vcmi-wasm/server/battles/BattleActionProcessor.cpp','utf8');
 const start=source.indexOf('int64_t toHeal = sourceVampire ? drainDamage');
 const end=source.indexOf('\n\t}\n\n\t//soul steal handling',start);
 assert(start>=0&&end>start,'Production life-drain integration must be located');
 // Compile the production dispatch itself. The small state double models only
 // CUnitState::heal's CLONE rejection and CHealth's initial-HP capacity clamp;
 // this is an integration regression, not a full battle runtime witness.
 const dispatch=source.slice(start,end);
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'heroes-source-vampire-clone-'));
 try{
  const cpp=path.join(directory,'probe.cpp'),binary=path.join(directory,'probe');
  const root=process.cwd();
  fs.writeFileSync(cpp,`#include "${root}/work/vcmi-wasm/lib/era/EraCloneHealScope.h"
#include "${root}/work/vcmi-wasm/lib/era/EraBridgeRuntime.h"
#include <algorithm>
#include <cassert>
#include <cstdint>
enum class BonusType { LIFE_DRAIN };
enum class EHealLevel { RESURRECT };
enum class EHealPower { PERMANENT };
struct State {
 bool cloned;
 int64_t hp;
 int valOfBonuses(BonusType) const { return 100; }
 int64_t heal(int64_t & amount,EHealLevel,EHealPower) {
  if(cloned)return 0;
  amount=std::clamp<int64_t>(amount,0,30-hp);hp+=amount;return amount;
 }
};
void drain(State * attackerState,bool sourceVampire,int64_t drainDamage) {
 int64_t healInfo=0;
 ${dispatch}
 assert(healInfo>=0);
}
int main() {
 const auto rebirth=era_bridge::rebirth(10,3,1.0f,.3f,.5f,0,3,false);
 assert(rebirth.health==24);
 State sourceClone{true,rebirth.health};
 drain(&sourceClone,true,12);assert(sourceClone.hp==30&&sourceClone.cloned);
 State vanillaClone{true,rebirth.health};
 drain(&vanillaClone,false,12);assert(vanillaClone.hp==24&&vanillaClone.cloned);
 State ordinary{false,rebirth.health};
 drain(&ordinary,true,3);assert(ordinary.hp==27&&!ordinary.cloned);
 State vanilla{false,rebirth.health};
 drain(&vanilla,false,12);assert(vanilla.hp==30&&!vanilla.cloned);
}
`);
  let compiler;
  for(const candidate of [...new Set([process.env.CXX,'clang++','g++'].filter(Boolean))]){
   try{execFileSync(candidate,['--version'],{stdio:'ignore'});compiler=candidate;break;}catch{}
  }
  assert(compiler,'A C++17 compiler is required');
  execFileSync(compiler,['-std=c++17','-Wall','-Wextra','-Werror','-pedantic','-fsanitize=address,undefined',cpp,'-o',binary],{stdio:'pipe'});
  execFileSync(binary,[],{stdio:'pipe'});
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
