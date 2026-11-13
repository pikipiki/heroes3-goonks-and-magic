/* Source286 U#60, machine71DFE0..71E006. GPL-2.0-or-later. */
#pragma once
#include "EraSourceRoundTwoSummon.h"
#include <algorithm>
#include <limits>
namespace era_bridge
{
inline bool demilichSummonRound(int round){return round>=2&&(round-2)%4==0;}
inline int demilichSummonPercent(int rank){return rank<=0?5:10*std::clamp(rank,1,10);}
inline int demilichPoisonChance(int rank){return std::max(5,5*std::clamp(rank,0,10));}
inline int64_t demilichSummonCount(int32_t livingCount,int rank)
{
    const auto amount=sourceRoundTwoSummonCount(livingCount,demilichSummonPercent(rank));
    //77CF50 returns the converted integer in EAX. At countINT_MAX the
    //float32 rank10 delta is2^31, negative as LONG;71DFB0 then skips it.
    return amount>std::numeric_limits<int32_t>::max()?0:amount;
}
}
