#include "../../work/vcmi-wasm/lib/era/EraHydraQueen259.h"
#include <cassert>
#include <initializer_list>
int main()
{
    using era_bridge::sourceHydraQueenEligible;
    for(int source: {63,154,159,221,224,296,325})assert(!sourceHydraQueenEligible(false,false,false,source));
    assert(sourceHydraQueenEligible(false,false,false,0));
    assert(sourceHydraQueenEligible(false,false,false,-1)); // Foreign Goonks are not a source life-drain type.
    assert(!sourceHydraQueenEligible(true,false,false,0));
    assert(!sourceHydraQueenEligible(false,true,false,0));
    assert(!sourceHydraQueenEligible(false,false,true,0));
}
