#pragma once
#include <algorithm>
#include <cstdint>

namespace era_bridge::mithril
{
inline int legacyMineMarker(bool weekly,bool protectedMine,int currentDay,std::int64_t untilDay)
{
    if(weekly)return protectedMine?7:0;
    if(untilDay<=currentDay)return 0;
    if(untilDay>=static_cast<std::int64_t>(currentDay)+15)return 15;
    return static_cast<int>(untilDay-currentDay);
}
inline int nextMineMarker(int marker)
{return std::max(0,marker-1);}
}
