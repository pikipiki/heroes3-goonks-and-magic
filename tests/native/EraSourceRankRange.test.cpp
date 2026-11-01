#include "../../work/vcmi-wasm/lib/era/EraSourceRankRange.h"
#include <cassert>
#include <initializer_list>
int main()
{
 using namespace era_bridge;
 assert(!sourceRankRangeAccepts(1,1,255,false)); // Actual upstream strict-lower defect.
 assert(sourceRankRangeAccepts(1,1,255,true));
 assert(!sourceRankRangeAccepts(0,1,255,true));
 assert(!sourceRankRangeAccepts(6,7,9,true));
 assert(sourceRankRangeAccepts(7,7,9,true));
 assert(sourceRankRangeAccepts(8,7,9,true));
 assert(!sourceRankRangeAccepts(9,7,9,true));
 for(int rank=0;rank<=10;++rank)
  assert(sourceRankRangeAccepts(rank,10,255,true)==(rank==10));
 for(bool side:{false,true})for(bool hypnosis:{false,true})
 {
  assert(sourceDispelImmune(1,side,hypnosis,35));
  assert(sourceDispelImmune(2,side,hypnosis,35)==(side==hypnosis));
  assert(!sourceDispelImmune(0,side,hypnosis,35));
  assert(!sourceDispelImmune(1,side,hypnosis,78)); // wP never protects dragon DispelHelpful78.
  assert(!sourceDispelImmune(2,side,hypnosis,78));
 }
}
