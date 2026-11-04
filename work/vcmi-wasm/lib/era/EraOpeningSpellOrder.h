#pragma once
#include <algorithm>
#include <set>
#include <stdexcept>
#include <utility>
#include <vector>
namespace era_bridge
{
// Emerald shipped1001921c..100192fe: equipment0..18; BattleStartAction j0..8.
struct EmeraldOpeningSlot { int equipmentSlot; int autocastIndex; int token; };
inline std::vector<int> emeraldOpeningOrder(std::vector<EmeraldOpeningSlot> entries)
{
    std::set<std::pair<int,int>> occupied;
    for(const auto & entry:entries)
        if(entry.equipmentSlot<0 || entry.equipmentSlot>18 || entry.autocastIndex<0
            || entry.autocastIndex>8 || !occupied.emplace(entry.equipmentSlot,entry.autocastIndex).second)
            throw std::runtime_error("ERA opening: invalid/duplicate equipped autocast index");
    std::sort(entries.begin(),entries.end(),[](const auto & left,const auto & right)
    {
        return std::make_pair(left.equipmentSlot,left.autocastIndex)
            < std::make_pair(right.equipmentSlot,right.autocastIndex);
    });
    std::vector<int> result;for(const auto & entry:entries)result.push_back(entry.token);
    return result;
}
}
