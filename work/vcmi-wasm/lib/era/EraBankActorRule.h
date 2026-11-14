/* Original TUM bank dependency cohort; source values, never fallback actors. */
#pragma once
#include <array>
#include <cstdint>
#include <string_view>

namespace era_bridge
{
constexpr std::array<int,10> bankActorSourceIds{{253,272,281,289,290,301,302,330,340,358}};
constexpr bool bankActorSource(int source)
{
    for(const int id:bankActorSourceIds)if(id==source)return true;
    return false;
}
constexpr int bankRushCounter(int current,int amount=1)
{
    // Spell_1_mode_rush: reject nonpositive/63+ input; ADD BYTE then signed cap63.
    if(current<0||current>255||amount<=0||amount>=63)return current;
    const int added=(current+amount)&255;
    return added<128&&added>63?63:added;
}
constexpr bool bankSourceHatePair(int attacker,int target)
{
    return ((attacker==272||attacker==281)&&(target==277||target==285))
        ||(attacker==289&&target==292)||(attacker==290&&target==289)
        ||(attacker==330&&target==132);
}
constexpr bool bankSourceHateTarget(int target)
{return target==132||target==277||target==285||target==289||target==292;}
constexpr int bankDeathStareCap(int count)
{return count>0?count/10+(count%10!=0):0;}
constexpr std::array<int,11> bankLordBlock{{0,10,15,20,25,30,35,40,50,55,60}};
constexpr std::array<int,11> bankTiamatDeathStare{{0,5,10,12,14,16,18,20,24,28,30}};
}
