#pragma once
namespace era_bridge
{
inline bool sourceRankRangeAccepts(int rank, int minimum, int maximum, bool sourceProfile)
{
    return (sourceProfile ? rank >= minimum : rank > minimum) && rank < maximum;
}
inline bool sourceDispelImmune(int mode, bool sameInitialSide, bool hypnotized, int spell)
{
    if(spell != 35)
        return false;
    const bool sameEffectiveSide = sameInitialSide != hypnotized;
    return mode == 1 || (mode == 2 && !sameEffectiveSide);
}
}
