#include "../../work/vcmi-wasm/lib/era/EraAdvancedArtifactRuntime.h"
#include <cassert>
int main()
{
    using namespace era_bridge;
    assert(diplomatPerceivedStrength(123,false)==123);
    assert(diplomatPerceivedStrength(123,true)==369);
    assert(diplomatPerceivedStrength(UINT64_MAX,true)==UINT64_MAX);
    assert(lightningOwnChainProtected(19,true,true));
    assert(!lightningOwnChainProtected(17,true,true));
    assert(!lightningOwnChainProtected(19,false,true));
    assert(lightningRawSupplement(19,true,true,true,10,25,50)==300);
    assert(lightningRawSupplement(19,true,true,true,10,25,50)==300); // same raw amount at every bounce
    assert(lightningRawSupplement(19,false,true,true,10,25,50)==0);
    assert(lightningRawSupplement(19,true,false,true,10,25,50)==0);
    assert(lightningRawSupplement(19,true,true,false,10,25,50)==0);
    assert(lightningRawSupplement(17,true,true,true,10,25,50)==0);
}
