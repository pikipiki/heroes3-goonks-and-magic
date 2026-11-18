/* WoG map rule116, WOG_101_IncreaseArmies. GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>
namespace era_bridge::map_rules
{
inline int32_t dailyArmyCount(int32_t count)
{
    // The source only writes if its final bounded value exceeds the old count.
    // At/above the cap that cannot happen, even after signed VR overflow.
    if(count<=0||count>=100000)return count;
    return std::min<int32_t>(100000,count*104/100);
}
}
