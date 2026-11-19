#include "../../work/vcmi-wasm/lib/era/EraCreaturePriceRules.h"
#include <cassert>
#include <cstdint>
#include <limits>
int main()
{
    using namespace era_bridge::creature_prices;
    assert(half(125)==62&&restore(62)==125);
    assert(half(129)==64&&restore(64)==128);
    assert(half(1)==0&&restore(0)==0);
    assert(half(-1)==2147483647&&restore(2147483647)==-2);
    assert(half(std::numeric_limits<int32_t>::min())==1073741824);
    assert(restore(1073741824)==std::numeric_limits<int32_t>::min());
    assert(restore(-2147483646)==5);
    assert(half(2147483647)==1073741823&&restore(1073741823)==2147483646);
    assert(!wantsHalf(1,false,1));assert(!wantsHalf(1,true,7));
    assert(wantsHalf(2,false,2));assert(!wantsHalf(2,true,2));assert(wantsHalf(7,true,7));assert(!wantsHalf(8,true,1));
    for(int source=145;source<=149;++source)assert(!affectedSourceCreature(source));
    assert(affectedSourceCreature(0)&&affectedSourceCreature(144)&&affectedSourceCreature(150)&&affectedSourceCreature(362));
    assert(!affectedSourceCreature(-1));
    assert(fortGold(3,25)==0 && fortGold(6,25)==1);
    assert(fortGold(9,50)==4 && fortGold(9,75)==6);
    assert(fortGold(16777217,100)==16777216);
    assert(fortGold(2147483647,100)==std::numeric_limits<int32_t>::min());
}
