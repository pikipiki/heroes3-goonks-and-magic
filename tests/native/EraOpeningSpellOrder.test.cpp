#include "../../work/vcmi-wasm/lib/era/EraOpeningSpellOrder.h"
#include <cassert>
int main(){using namespace era_bridge;
 assert(emeraldOpeningOrder({}).empty());
 assert((emeraldOpeningOrder({{18,8,7},{0,8,2},{0,0,0},{18,0,6},{4,0,3},{0,1,1}})==std::vector<int>{0,1,2,3,6,7}));
 // Duplicate artifact types in different equipment slots still cast per slot.
 assert((emeraldOpeningOrder({{7,0,20},{6,0,10}})==std::vector<int>{10,20}));
 for(const auto & rows:std::vector<std::vector<EmeraldOpeningSlot>>{{{19,0,1}},{{-1,0,1}},{{0,9,1}},{{0,-1,1}},{{0,0,1},{0,0,2}}}){bool rejected=false;try{emeraldOpeningOrder(rows);}catch(const std::runtime_error&){rejected=true;}assert(rejected);}
}
