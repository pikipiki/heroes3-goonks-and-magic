/* Source180 perceived army strength and220 raw supplementary bolt arithmetic. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <limits>
namespace era_bridge
{
inline std::uint64_t diplomatPerceivedStrength(std::uint64_t actual,bool equipped)
{
    if(!equipped)return actual;
    constexpr auto limit=std::numeric_limits<std::uint64_t>::max();
    return actual>limit/3?limit:actual*3;
}
inline bool lightningSpell(int id){return id==17 || id==19;}
inline bool lightningOwnChainProtected(int spell,bool sameSide,bool castingSideRod)
{
    return spell==19 && sameSide && castingSideRod;
}
inline std::int64_t lightningRawSupplement(int spell,bool heroCast,bool castingSideRod,bool hostile,
    int heroPower,int coefficient,int masteryBase)
{
    if(spell!=19 || !heroCast || !castingSideRod || !hostile)return 0;
    return static_cast<std::int64_t>(heroPower)*coefficient+masteryBase;
}
}
