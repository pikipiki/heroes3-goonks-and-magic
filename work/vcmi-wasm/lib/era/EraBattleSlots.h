/* Source heroMonCount and 479A30 reusable-slot semantics. GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <map>
#include <stdexcept>
#include <vector>
namespace era_bridge
{
struct BattleSlotState
{
    int slot;
    bool alive;
    bool summoned;
};
struct BattleSlotAllocation
{
    int slot;
    bool originalDomain;
};
inline BattleSlotAllocation allocateBattleSlot(const std::vector<BattleSlotState> & states)
{
    std::map<int, const BattleSlotState *> occupied;
    int highwater=0;
    for(const auto & state:states)
    {
        if(state.slot<0)continue;
        if(!occupied.emplace(state.slot,&state).second)
            throw std::logic_error("ERA battle slot assigned twice");
        highwater=std::max(highwater,state.slot+1);
    }
    // Original479A30 searches twenty slots, reusing DEAD+SUMMON (bit22),
    // never an ordinary corpse. Clone is not an additional prerequisite.
    for(int slot=0;slot<20;++slot)
    {
        const auto found=occupied.find(slot);
        if(found==occupied.end() || (!found->second->alive && found->second->summoned))
            return {slot,true};
    }
    // Additional VCMI units have no ERA representation. Keep them playable;
    // append them explicitly rather than dropping their spell targets or RNG.
    return {highwater,false};
}
}
