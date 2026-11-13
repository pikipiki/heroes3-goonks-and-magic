#include "../../work/vcmi-wasm/lib/era/EraOrbChaos238.h"
#include <cassert>
#include <limits>
int main()
{
    using era_bridge::sourceOrbChaosDamage;
    using era_bridge::sourceChainRawDamage;
    assert(sourceChainRawDamage(50,0)==50);
    assert(sourceChainRawDamage(50,1)==25);
    assert(sourceChainRawDamage(50,2)==12);
    assert(sourceChainRawDamage(-3,1)==-1);
    assert(sourceOrbChaosDamage(37)==55);
    assert(sourceOrbChaosDamage(0)==0);
    assert(sourceOrbChaosDamage(1)==1);
    assert(sourceOrbChaosDamage(3)==4);
    assert(sourceOrbChaosDamage(45)==67);
    assert(sourceOrbChaosDamage(-5)==-7);
    assert(sourceOrbChaosDamage(715827883)==-1073741823);
    assert(sourceOrbChaosDamage(std::numeric_limits<int32_t>::max())==1073741822);
    assert(sourceOrbChaosDamage(std::numeric_limits<int32_t>::min())==-1073741824);
    assert(sourceOrbChaosDamage(std::numeric_limits<int64_t>::max())==-1);
}
