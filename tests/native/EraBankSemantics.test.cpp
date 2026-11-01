#include "../../work/vcmi-wasm/lib/era/EraBankSemantics.h"
#include "../../work/vcmi-wasm/lib/era/EraNeutralDwellingRmg.h"
#include <cassert>
int main()
{
    for(bool neutral:{false,true})
    {
        assert(!era_bridge::dwellingRmgEligible(false,neutral,false));
        assert(era_bridge::dwellingRmgEligible(true,neutral,false));
        assert(era_bridge::dwellingRmgEligible(false,neutral,true)==neutral);
        assert(era_bridge::dwellingRmgEligible(true,neutral,true));
    }
    const std::array<int,4> chances{25,25,25,10};
    std::array<int,4> results{};
    for(int roll=0;roll<100;++roll)
        ++results[era_bridge::bankState(chances,roll)];
    assert((results==std::array<int,4>{25,25,25,25}));
    const std::array<int,4> uneven{30,30,6,10};
    results.fill(0);
    for(int roll=0;roll<100;++roll)
        ++results[era_bridge::bankState(uneven,roll)];
    assert((results==std::array<int,4>{30,30,6,34}));
    assert(era_bridge::bankState({100,0,0,0},99)==0);
}
