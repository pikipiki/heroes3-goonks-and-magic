#include "../../work/vcmi-wasm/lib/era/EraStartingLevelRules.h"
#include <cassert>
#include <array>
#include <limits>
int main()
{
    using namespace era_bridge::starting_level;
    constexpr auto lo=std::numeric_limits<int32_t>::min(),hi=std::numeric_limits<int32_t>::max();
    const std::array<int32_t,12> words{{lo,lo+1,-100000,-1,0,999,4600,4999,5000,5001,100000,hi}};
    for(const auto old:words)
    {
        const auto delta=heroDelta(old);
        assert(bool(delta)==(old<5000));
        if(delta)assert(add(old,*delta)==5000);
    }
    // The arithmetic operation is modular, including the INT_MIN delta.
    assert(*heroDelta(lo)==lo+5000);assert(add(hi,1)==lo);assert(add(lo,-1)==hi);
    assert(signedWord(UINT32_MAX)==-1);
    for(uint32_t bits=0;bits<1000000;bits+=997)
    {
        const auto old=signedWord(bits*UINT32_C(2654435761));
        if(const auto delta=heroDelta(old))assert(add(old,*delta)==5000);
    }
    assert(commanderDelta(5000,1200,false)==3800);
    assert(commanderDelta(5000,1200,true)==5700);
    assert(commanderDelta(5000,5000,true)==0);
    assert(commanderDelta(5000,5001,true)==-1); // truncate toward zero
    assert(commanderDelta(lo,0,true)==0); // MUL32 precedes signed division
    assert(commanderDelta(5000,lo,false)==lo+5000);
    assert(purchaseBonus(true)==7500);assert(purchaseBonus(false)==5000);
    assert(add(hi,purchaseBonus(true))==lo+7499);
}
