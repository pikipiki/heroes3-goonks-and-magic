#include "../../work/vcmi-wasm/lib/era/EraWayfarerMovement.h"
#include <cassert>
#include <limits>
int main()
{
    using era_bridge::sourceWayfarerDailyRemaining;
    assert(sourceWayfarerDailyRemaining(0)==400);
    assert(sourceWayfarerDailyRemaining(1560)==1960);
    assert(sourceWayfarerDailyRemaining(2000)==2400);
    assert(sourceWayfarerDailyRemaining(3000)==3400);
    assert(sourceWayfarerDailyRemaining(std::numeric_limits<int32_t>::max())==std::numeric_limits<int32_t>::min()+399);
}
