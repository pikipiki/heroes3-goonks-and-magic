#include "../../work/vcmi-wasm/lib/era/EraHypnotizeHealth.h"
#include <cassert>
#include <cstdint>
#include <limits>
int main()
{
    using era_bridge::sourceHypnotizeHealth;
    assert(sourceHypnotizeHealth(1,335)==335);
    assert(sourceHypnotizeHealth(32767,65536)==2147418112);
    assert(sourceHypnotizeHealth(32768,65536)==std::numeric_limits<int32_t>::min());
    assert(sourceHypnotizeHealth(65536,65536)==0);
    assert(sourceHypnotizeHealth(std::numeric_limits<int32_t>::max(),std::numeric_limits<int32_t>::max())==1);
    assert(sourceHypnotizeHealth(3,1000000000)==-1294967296);
}
