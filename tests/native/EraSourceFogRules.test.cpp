#include "../../work/vcmi-wasm/lib/era/EraSourceFogRules.h"
#include <cassert>
#include <limits>
int main()
{
    using namespace era_bridge::source_fog;
    const std::array<int,8> separate{{0,1,2,3,4,5,6,7}};
    assert(preservedPlayers(0,separate)==0x101);
    assert(preservedPlayers(1,separate)==0x102);
    assert(preservedPlayers(-1,separate)==0x100);
    assert(preservedPlayers(8,separate)==0x100);
    assert(preservedPlayers(128,separate)==0x100);
    assert(darknessArgument(0,separate)==1);
    assert(preservedPlayers(darknessArgument(0,separate),separate)==0x102);
    assert(darknessArgument(1,separate)==2);
    assert(preservedPlayers(darknessArgument(1,separate),separate)==0x104);
    const std::array<int,8> allied{{0,0,2,3,4,5,6,7}};
    assert(darknessArgument(0,allied)==3);
    assert(preservedPlayers(3,allied)==0x108);
    const std::array<int,8> absent{{0,1,-1,-1,-1,-1,-1,-1}};
    assert(preservedPlayers(2,absent)==0x1fc);
    assert(darknessArgument(2,absent)==4);
    assert(includes(0,0,0));assert(!includes(1,0,0));
    assert(includes(1,1,1));assert(!includes(2,0,1));
    assert(includes(2,1,2));assert(!includes(2,2,2));
    assert(includes(3,4,5));assert(!includes(4,4,5));
    assert(!includes(0,0,-1));
    assert(includes(2147483647,0,2147483647));
    assert(!includes(2147483647,2147483647,2147483647));
    assert(!includes(std::numeric_limits<int>::min(),0,2147483647));
}
