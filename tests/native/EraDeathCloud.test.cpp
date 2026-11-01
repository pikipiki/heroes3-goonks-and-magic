#include "../../work/vcmi-wasm/lib/era/EraDeathCloud.h"
#include <cassert>
int main()
{
    using era_bridge::deathCloudTarget;
    assert(deathCloudTarget(true,true,false)); // central undead hit normally
    assert(!deathCloudTarget(true,false,false)); // undead collateral excluded
    assert(deathCloudTarget(true,false,true)); // sourceLiving construct271 IS hit
    assert(!deathCloudTarget(false,true,true));
    assert(!deathCloudTarget(false,false,true));
}
