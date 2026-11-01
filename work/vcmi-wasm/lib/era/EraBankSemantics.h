#pragma once
#include <array>
#include <stdexcept>

namespace era_bridge
{
// h3era.exe SHA256451e208c...; REA ev_1e22d8e4...0x47A6C0.
// The fourth source chance is intentionally unused. Native dice are0..99.
inline int bankState(const std::array<int,4> & chances, int nativeRoll)
{
    if(nativeRoll<0 || nativeRoll>99)
        throw std::invalid_argument("ERA bank native roll outside0..99");
    int roll=nativeRoll+1;
    for(int state=0;state<3;++state)
    {
        if(chances[state]<0 || chances[state]>100)
            throw std::invalid_argument("ERA bank chance outside0..100");
        roll-=chances[state];
        if(roll<=0)
            return state;
    }
    return 3;
}
}
