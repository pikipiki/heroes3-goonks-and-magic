#include "../../work/vcmi-wasm/lib/era/EraBattleSlots.h"
#include <cassert>
#include <vector>
int main()
{
 using namespace era_bridge;
 // Original non-summoned corpses continue occupying their array positions.
 std::vector<BattleSlotState> slots{{1,false,false},{0,true,false}};
 assert(allocateBattleSlot(slots).slot==2);
 slots.push_back({2,true,true}); // new clone, still alive
 assert(allocateBattleSlot(slots).slot==3);
 slots.back().alive=false; // DEAD+SUMMON, not necessarily CLONE
 assert(allocateBattleSlot(slots).slot==2);
 slots.back().slot=-2; // native historical ghost overwritten by new unit
 slots.push_back({2,true,true});
 assert(allocateBattleSlot(slots).slot==3);
 // A dead ordinary summoned creature also qualifies; Clone is not required.
 slots.back().alive=false;
 assert(allocateBattleSlot(slots).slot==2);
 // Unused positions precede later reusable corpses.
 assert(allocateBattleSlot({{0,true,false},{2,false,true}}).slot==1);
 std::vector<BattleSlotState> full;
 for(int i=0;i<20;++i)full.push_back({i,true,false});
 auto overflow=allocateBattleSlot(full);
 assert(overflow.slot==20 && !overflow.originalDomain);
 full.push_back({20,true,true});
 assert(allocateBattleSlot(full).slot==21);
 full[7]={7,false,true};
 auto reused=allocateBattleSlot(full);
 assert(reused.slot==7 && reused.originalDomain);
 bool rejected=false;
 try{allocateBattleSlot({{0,true,false},{0,true,true}});}
 catch(const std::logic_error&){rejected=true;}
 assert(rejected);
}
