#include "../../work/vcmi-wasm/lib/era/EraIncomeRules.h"
#include <cassert>
#include <cstdint>
#include <limits>
int main()
{
    using era_bridge::regularIncomeAfterHandicap;
    constexpr int64_t cap=1000000000;
    // Independent source PE oracle: aggregate two improved rare mines before
    // handicap, with truncation toward zero rather than native ceil rounding.
    assert(regularIncomeAfterHandicap(4,85,cap)==3);
    assert(regularIncomeAfterHandicap(4,70,cap)==2);
    assert(regularIncomeAfterHandicap(2,85,cap)==1);
    assert(regularIncomeAfterHandicap(4,100,cap)==4);
    assert(regularIncomeAfterHandicap(-4,85,cap)==-3);
    assert(regularIncomeAfterHandicap(4,0,cap)==0);
    assert(regularIncomeAfterHandicap(4,200,cap)==8);
    assert(regularIncomeAfterHandicap(std::numeric_limits<int32_t>::max(),200,cap)==cap);
    assert(regularIncomeAfterHandicap(std::numeric_limits<int32_t>::min(),100,cap)==std::numeric_limits<int32_t>::min());
    assert(regularIncomeAfterHandicap(std::numeric_limits<int32_t>::min(),std::numeric_limits<int32_t>::min(),cap)==cap);
}
