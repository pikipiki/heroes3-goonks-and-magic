/* Source77 rule126: gained levels are base1; GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>
namespace era_bridge::level_artifacts
{
inline int classMask(int gainedLevel,bool human)
{
    const int scaled=human?gainedLevel:(gainedLevel>>1);
    return 1<<std::clamp(scaled/6+1,1,4);
}
template<class Requirement>
int humanBatchCount(int firstGainedLevel,int32_t experience,Requirement requirement)
{
    if(firstGainedLevel<1||firstGainedLevel>104)return 0;
    int result=0;
    for(int level=firstGainedLevel;level<=104;++level)
    {
        if(experience<requirement(level))break;
        ++result;
    }
    return result;
}
}
