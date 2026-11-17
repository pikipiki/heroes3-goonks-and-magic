/* WoG Mithril Enhancements v1.4, script42 (2023 revision). GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <cstdlib>

namespace era_bridge::mithril
{
inline int mineCost(int sourceResource,bool weeklyResourceChange=false)
{
    if(sourceResource<0)return 0;
    if(weeklyResourceChange)
    {
        if(sourceResource>6)return 0;
        constexpr int costs[]={1,3,1,3,3,3,5};
        return costs[sourceResource];
    }
    return sourceResource>=6?7:4;
}
inline int dwellingCost(int tier,bool alreadyUpgraded)
{
    if(tier<1)return 0;
    const int base=tier<=3?1:tier<=5?2:3;
    return base*(alreadyUpgraded?2:1);
}
inline bool near(int hx,int hy,int hz,int ox,int oy,int oz)
{return hz==oz&&std::abs(hx-ox)<=1&&std::abs(hy-oy)<=1;}
inline bool mineActive(int currentDay,int untilDay)
{return untilDay>0&&currentDay<untilDay;}
inline int daysRemaining(int currentDay,int untilDay)
{return std::max(0,untilDay-currentDay);}
inline int fixedCost(int sourceObject)
{
    switch(sourceObject)
    {
        case 43:case 45:return 1; // one-way/two-way monoliths
        case 109:case 112:return 5; // water wheel/windmill
        case 113:return 2; // witch hut
        case 104:return 4; // university
        case 87:return 3; // shipyard
        default:return 0;
    }
}
inline uint32_t coordinateSeed(uint32_t base,int x,int y,int z)
{
    if(x<1||x>255)x=255;
    if(y<1||y>255)y=255;
    return base*255U*static_cast<uint32_t>(x)*255U*static_cast<uint32_t>(y)
        +(z<1?base:static_cast<uint32_t>(z));
}
inline uint32_t splitMix32(uint32_t & seed)
{
    seed+=0x9e3779b9U;
    auto value=seed^(seed>>15);
    value*=0x85ebca6bU;value^=value>>13;value*=0xc2b2ae35U;
    return value^(value>>16);
}
inline int safeRand(uint32_t seed,int minimum,int maximum)
{
    if(minimum>=maximum)return minimum;
    const uint32_t range=static_cast<uint32_t>(int64_t(maximum)-minimum+1);
    const uint32_t limit=UINT32_MAX/range*range-1;
    uint32_t value=0;
    for(int i=0;i<=100;++i){value=splitMix32(seed);if(value<=limit)break;}
    return static_cast<int>(int64_t(minimum)+value%range);
}
}
