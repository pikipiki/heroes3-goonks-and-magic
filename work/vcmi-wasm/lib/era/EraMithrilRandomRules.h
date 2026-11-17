/* ERA 3 FastRand + Array_Shuffle shrine selection. GPL-2.0-or-later. */
#pragma once
#include "EraMithrilRules.h"
#include <array>
#include <limits>
#include <numeric>
#include <vector>

namespace era_bridge::mithril
{
// Named TXoroshiro128Rng by the upstream library. Keep its four 32-bit
// words, SplitMix32 seeding and unsigned range rejection exactly.
class ShrineRandom
{
    std::array<uint32_t,4> state;
    static uint32_t rotate(uint32_t value,unsigned bits)
    {return (value<<bits)|(value>>(32-bits));}
public:
    explicit ShrineRandom(uint32_t seed)
    {for(auto & word:state)word=splitMix32(seed);}
    uint32_t next()
    {
        const uint32_t result=rotate(state[1]*5U,7)*9U;
        const uint32_t temp=state[1]<<9;
        state[2]^=state[0];state[3]^=state[1];
        state[1]^=state[2];state[0]^=state[3];
        state[2]^=temp;state[3]=rotate(state[3],11);
        return result;
    }
    int32_t range(int32_t minimum,int32_t maximum)
    {
        if(minimum>=maximum)return minimum;
        uint32_t result=next();
        if(minimum==INT32_MIN&&maximum==INT32_MAX)
            return result<=INT32_MAX?static_cast<int32_t>(result):static_cast<int32_t>(int64_t(result)-0x100000000LL);
        const uint32_t length=static_cast<uint32_t>(int64_t(maximum)-minimum+1);
        uint32_t biased=UINT32_MAX%length+1;
        if(biased==length)biased=0;
        const uint32_t limit=UINT32_MAX-biased;
        for(int attempt=2;result>limit&&attempt<=100;++attempt)result=next();
        return static_cast<int32_t>(int64_t(minimum)+result%length);
    }
};
inline std::array<int,70> shrineSpellOrder(uint32_t seed)
{
    std::array<int,70> spells;std::iota(spells.begin(),spells.end(),0);
    ShrineRandom random(seed);
    for(int i=0;i<70;++i)std::swap(spells[i],spells[random.range(i,69)]);
    return spells;
}
inline int shrineSpell(uint32_t seed,const std::vector<int> & eligible)
{
    for(const auto spell:shrineSpellOrder(seed))
        if(std::find(eligible.begin(),eligible.end(),spell)!=eligible.end())return spell;
    return -1;
}
}
