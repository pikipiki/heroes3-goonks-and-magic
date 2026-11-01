#pragma once
#include <algorithm>
namespace era_bridge
{
inline bool experienceAttackTriggers(int chance,int roll1To100)
{
    return roll1To100 >= 1 && roll1To100 <= 100 && roll1To100 <= std::clamp(chance,0,100);
}
inline bool experiencePrimaryTargetAccepts(bool receptive,int resistance,int roll1To100)
{
    return receptive && experienceAttackTriggers(100-std::clamp(resistance,0,100),roll1To100);
}
}
