/* Sourceu217/#48 numerical and three-position geometry only. Integration remains
 * gated on source lifecycle/result semantics. GPL-2.0-or-later. */
#pragma once
#include <array>
#include <cstdint>
namespace era_bridge
{
inline int64_t sourceRoundTwoSummonCount(int32_t livingCount,int percent)
{
    if(livingCount<=0 || percent<=0)return 0;
    const float original=static_cast<float>(livingCount);
    //71C10C..128 stores float32 after an x87 percent increase with +0.5.
    const float augmented=static_cast<float>(static_cast<double>(original)
        +static_cast<double>(original)*percent/100.0+0.5);
    return static_cast<int64_t>(static_cast<double>(augmented)-original);
}
inline std::array<int,3> sourcePitMasterSummonPositions(int origin,bool defender)
{
    if(origin<0 || origin>=187 || origin%17<1 || origin%17>15)return {-1,-1,-1};
    const int row=origin/17;
    const int x=2*(origin%17-1)+(row%2==0?1:0);
    const int sign=defender?-1:1;
    auto hex=[](int px,int py)
    {
        //75B1A8 rejects these bounds before75B06D table lookup. The three
        // offsets preserve parity in the source's30x11 doubled coordinate map.
        if(px<0 || px>29 || py<0 || py>10)return -1;
        const int parity=py%2==0?1:0;
        if((px&1)!=parity)return -1;
        return 17*py+(px-parity)/2+1;
    };
    return {hex(x+2*sign,row),hex(x+sign,row-1),hex(x+sign,row+1)};
}
}
