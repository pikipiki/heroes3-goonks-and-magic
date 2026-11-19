#include "../../work/vcmi-wasm/lib/era/EraMapEighthUpgradeRules.h"
#include <cassert>
#include <limits>
int main()
{
    using namespace era_bridge::map_rules;
    assert(era_bridge::stack_experience::retainedUpgradeExperience(-43165,.75f)==-32373);
    assert(era_bridge::stack_experience::retainedUpgradeExperience(-5,.75f)==-3);
    assert(era_bridge::stack_experience::retainedUpgradeExperience(-2,.75f)==-1);
    assert(era_bridge::stack_experience::retainedUpgradeExperience(-1,.75f)==0);
    assert(era_bridge::stack_experience::merge(-300,200,5,100000)==-20);
    assert(era_bridge::stack_experience::merge(-100,1000000,10,20000)==20000);
    assert(era_bridge::stack_experience::merge(-1,0,1,100000)==-1);
    for(const auto & pair:eighthUpgradePairs)assert(eighthUpgradeTarget(pair.first)==pair.second);
    for(int id:{-1,0,12,14,130,132,150,158,159,362})assert(!eighthUpgradeTarget(id));
    assert(!eighthUpgradeHasQuantity({0,0,0,0,0,0,0}));
    assert(eighthUpgradeHasQuantity({1,2,0,0,0,0,0}));
    assert(!eighthUpgradeHasQuantity({1073741824,1073741824,1073741824,1073741824,0,0,0}));
    assert(eighthUpgradeExperience(75000,20,100000,200000)==75000);
    assert(eighthUpgradeExperience(75000,20,50000,200000)==50000);
    assert(eighthUpgradeExperience(75000,20,100000,40000)==40000);
    assert(eighthUpgradeExperience(100000,30000,100000,200000)==-43165);
    assert(eighthUpgradeExperience(-100,3,100000,200000)==-100);
    assert(eighthUpgradeExperience(0,1,100000,200000)==0);
    assert(eighthUpgradeExperience(100,0,100000,200000)==0);
    assert(eighthUpgradeExperience(100,-1,100000,200000)==0);
    assert(eighthUpgradeExperience(std::numeric_limits<int32_t>::max(),2,std::numeric_limits<int32_t>::max(),std::numeric_limits<int32_t>::max())==-1);
}
