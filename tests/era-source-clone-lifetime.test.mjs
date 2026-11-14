import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('source clone rebirth preserves only its existing finite lifetime carrier',()=>{
 const source=fs.readFileSync('work/vcmi-wasm/lib/battle/BattleInfo.cpp','utf8');
 const start=source.indexOf('auto selector = [deferredEraClone]');
 const end=source.indexOf('changedStack->removeBonusesRecursive(selector);',start);
 assert(start>=0&&end>start,'Production death/resurrection selector must be located');
 // Compile the actual selector; the doubles supply only Bonus/Spell metadata.
 // No substitute implementation of its inclusion/exclusion logic is tested.
 const selector=source.slice(start,end);
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'heroes-source-clone-lifetime-'));
 try{
  const cpp=path.join(directory,'probe.cpp'),binary=path.join(directory,'probe');
  fs.writeFileSync(cpp,`#include <cassert>
enum class BonusType { NONE, OTHER };
enum class BonusSource { SPELL_EFFECT, OTHER };
namespace BonusDuration { enum Type { N_TURNS, PERMANENT, N_DAYS }; }
struct Spell { bool isPersistent() const { return true; } };
struct SpellID {
 enum { CLONE=65 };
 int id; explicit SpellID(int value):id(value){}
 const Spell * toSpell() const { static Spell spell;return &spell; }
};
struct BonusSourceID {
 int id;explicit BonusSourceID(SpellID spell):id(spell.id){}
 bool operator==(const BonusSourceID & other) const { return id==other.id; }
 template<class T> T as() const { return T(id); }
};
struct Bonus {
 BonusType type=BonusType::NONE;
 BonusSource source=BonusSource::SPELL_EFFECT;
 BonusSourceID sid{SpellID(65)};
 BonusDuration::Type duration=BonusDuration::N_TURNS;
 int turnsRemain=7;
};
bool removes(bool deferredEraClone,const Bonus & bonus) {
 ${selector}
 return selector(&bonus);
}
int main() {
 Bonus lifetime;
 assert(!removes(true,lifetime));
 assert(lifetime.turnsRemain==7); // Neither death nor revival renews duration.
 assert(!removes(true,lifetime));assert(lifetime.turnsRemain==7);
 assert(removes(false,lifetime)); // Vanilla clone / non-clone source behavior.
 Bonus effect=lifetime;effect.type=BonusType::OTHER;assert(removes(true,effect));
 effect=lifetime;effect.source=BonusSource::OTHER;assert(!removes(true,effect));
 effect=lifetime;effect.sid=BonusSourceID(SpellID(64));assert(removes(true,effect));
 effect=lifetime;effect.duration=BonusDuration::PERMANENT;assert(removes(true,effect));
 effect=lifetime;effect.duration=BonusDuration::N_DAYS;assert(removes(true,effect));
 lifetime.turnsRemain=0;
 assert(!removes(true,lifetime));assert(lifetime.turnsRemain==0); // No extension of expired carrier.
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
