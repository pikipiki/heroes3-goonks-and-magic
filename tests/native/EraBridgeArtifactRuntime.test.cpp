#include "../../work/vcmi-wasm/lib/era/EraBridgeArtifactRuntime.h"
#include <cassert>
int main()
{
    using namespace era_bridge;
    std::array<int,7> army{{2,2,10,-1,3,198,99}};
    EquippedDailyConversions worn{};
    worn[3] = {{2,198},{3,198},{10,318}};
    auto plan = planDailyConversions(army,worn);
    assert(plan.size()==4);
    // Pair then army-slot order, not army-slot then pair.
    assert(plan[0].armySlot==0 && plan[1].armySlot==1);
    assert(plan[2].armySlot==4 && plan[3].armySlot==2);
    // Already-target stack remains unchanged, no merging and no count changes.
    assert(plan[0].from==2 && plan[0].to==198);
    worn[3] = {{2,3},{3,4}};
    worn[18] = {{4,5}};
    plan = planDailyConversions({{2,-1,-1,-1,-1,-1,-1}},worn);
    assert(plan.size()==3 && plan[0].to==3 && plan[1].to==4 && plan[2].to==5);
    // A preceding equipment slot is never revisited after later conversion.
    worn = {}; worn[0]={{3,4}}; worn[18]={{2,3}};
    plan = planDailyConversions({{2,-1,-1,-1,-1,-1,-1}},worn);
    assert(plan.size()==1 && plan[0].to==3);
    // No equipped artifact, no implicit backpack scanning.
    worn = {}; assert(planDailyConversions(army,worn).empty());
    // All seven slots and repeated artifact instances each execute once in order.
    worn[0]={{2,3}};worn[18]={{3,2}};
    plan=planDailyConversions({{2,2,2,2,2,2,2}},worn);assert(plan.size()==14);
    for(std::size_t i=0;i<7;++i){assert(plan[i].armySlot==i);assert(plan[i+7].armySlot==i);}
    // Source permits identity pairs; they must not send redundant packets.
    worn={};worn[3]={{2,2}};assert(planDailyConversions(army,worn).empty());
}
