#pragma once
namespace era_bridge
{
// Preserve the native faction gate by default. Only an explicitly opted-in
// neutral or mixed-faction dwelling may join a foreign-faction land zone's ordinary RMG pool.
inline bool dwellingRmgEligible(bool nativeFactionMatches,
                                 bool neutralOrMixedRecruitment,
                                 bool neutralAllowed)
{
    return nativeFactionMatches || (neutralOrMixedRecruitment && neutralAllowed);
}
}
