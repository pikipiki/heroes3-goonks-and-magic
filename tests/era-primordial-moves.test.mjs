import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

test('347 original slot counters preserve morale, action gates and slot reuse', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'primordial-moves-'));
  try {
    fs.writeFileSync(dir + '/test.cpp', `#include "${path.resolve('work/vcmi-wasm/lib/era/EraPrimordialMovesRule.h')}"
#include <cassert>
int main() {
 using namespace era_bridge;
 assert(primordialMoveSlot(0,0)==0 && primordialMoveSlot(1,20)==41);
 for(int side: {-1,2}) assert(primordialMoveSlot(side,0)==-1);
 for(int slot: {-2,-1,21}) assert(primordialMoveSlot(0,slot)==-1);
 PrimordialMoveSlots slots{}; std::array<bool,42> initial{}; initial[41]=true;
 primordialSeedMoves(slots,initial,0); assert(slots[41]==1 && slots[0]==0);
 auto first=primordialFailedMorale(slots[41],0xffffffffu,true);
 assert(first.grantedAction && first.counter==0 && first.flags==0xf2ffffffu);
 // WAIT bit25 survives, whereas bits24/26/27 are cleared.
 assert((first.flags&(1u<<25))!=0 && (first.flags&(1u<<24))==0);
 auto second=primordialFailedMorale(first.counter,0xffffffffu,true);
 assert(!second.grantedAction && second.counter==1 && second.flags==0xffffffffu);
 // Initial seeding is not a daily/round reset; mid-battle new347 starts0.
 primordialSeedMoves(slots,initial,1); assert(slots[0]==0);
 auto summoned=primordialFailedMorale(slots[0],0x04000000u,true);
 assert(!summoned.grantedAction && summoned.counter==1);
 // Residue belongs to physical slot: a non347 replacement can spend it.
 auto replacement=primordialFailedMorale(1,0x04000000u,false);
 assert(replacement.grantedAction && replacement.counter==0 && replacement.flags==0);
 auto depleted=primordialFailedMorale(0,0x04000000u,false);
 assert(!depleted.grantedAction && depleted.counter==0);
 // A successful normal morale roll never calls failedMorale: counter untouched.
 auto pending=slots[41]; bool hadMorale=true;
 assert(!primordialMoraleEntry(false,false,hadMorale,true,6)); assert(slots[41]==pending);
 for(int action=0;action<=13;++action) {
   bool expected=action==2||action==6||action==7||action==9||action==10;
   assert(primordialMoraleEntry(false,false,false,true,action)==expected);
   assert(!primordialMoraleEntry(true,false,false,true,action));
   assert(!primordialMoraleEntry(false,true,false,true,action));
   assert(!primordialMoraleEntry(false,false,false,false,action));
 }
 // All BYTE values are defined, no signed-char decrement or arithmetic UB.
 for(unsigned count=1;count<256;++count) {
   auto r=primordialFailedMorale(static_cast<std::uint8_t>(count),0xffffffffu,false);
   assert(r.counter==count-1 && r.grantedAction);
 }
 for(unsigned i=0;i<slots.size();++i) slots[i]=static_cast<std::uint8_t>(i*6);
 auto saved=primordialEncodeMoves(slots);
 assert(primordialDecodeMoves(saved).value()==slots);
 for(int field: {0,1,2}) { auto bad=saved; ++bad[field]; assert(!primordialDecodeMoves(bad)); }
 for(int value: {-1,256}) { auto bad=saved; bad[44]=value; assert(!primordialDecodeMoves(bad)); }
 saved.pop_back(); assert(!primordialDecodeMoves(saved));
 assert(!primordialDecodeMoves({1,347,27,1}));
 // Failed roll -> spend counter -> successful morale -> third action skips
 // the hook viaHAD_MORALE. The depleted counter survives into next round;
 // its next failure merely rearms it, producing one action in that round.
 auto extra=primordialFailedMorale(1,0x04000000u,true);
 assert(extra.grantedAction&&extra.counter==0);
 bool thirdActionHadMorale=true;
 assert(!primordialMoraleEntry(false,false,thirdActionHadMorale,true,6));
 auto followingRound=primordialFailedMorale(extra.counter,0x04000000u,true);
 assert(!followingRound.grantedAction&&followingRound.counter==1);
}`);
    execFileSync('c++', ['-std=c++17', '-fsanitize=undefined', '-fno-sanitize-recover=all', dir + '/test.cpp', '-o', dir + '/test']);
    execFileSync(dir + '/test');
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
