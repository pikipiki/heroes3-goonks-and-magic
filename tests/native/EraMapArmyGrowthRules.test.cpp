#include "../../work/vcmi-wasm/lib/era/EraMapArmyGrowthRules.h"
#include <cassert>
#include <climits>
#include <cstdint>
int main()
{
    using era_bridge::map_rules::dailyArmyCount;
    assert(dailyArmyCount(24)==24);assert(dailyArmyCount(25)==26);
    assert(dailyArmyCount(49)==50);assert(dailyArmyCount(50)==52);
    assert(dailyArmyCount(99999)==100000);
    for(int32_t count=0;count<=100000;++count)
    {
        // Full VR:S q *104 :100 Fq/100000; then HE:C only when n>q.
        auto n=static_cast<int32_t>(int64_t(count)*104/100);
        n=std::max(n,count);n=std::min(n,100000);
        const auto expected=n>count?n:count;
        assert(dailyArmyCount(count)==expected);
    }
    for(int32_t count:{100001,1000000,20000000,100000000,INT_MAX})
        assert(dailyArmyCount(count)==count);
    assert(dailyArmyCount(0)==0);
}
