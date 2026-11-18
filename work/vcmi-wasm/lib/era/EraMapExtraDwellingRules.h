#pragma once
#include <optional>
namespace era_bridge::map_rules
{
// Rule117 uses the source zero-based MA:L level, not the native town tier.
inline constexpr bool extraDwellingCreature(int objectType,int creature,int sourceLevel)
{
    return objectType==17&&sourceLevel!=0&&creature!=140&&creature!=142
        &&creature!=112&&creature!=127;
}
inline constexpr int extraDwellingSourceCreature(bool neutralTown)
{return neutralTown?112:140;}
inline constexpr int extraDwellingInitialStock=12;
inline constexpr std::optional<int> extraDwellingOption(bool frozen,bool neutralTown)
{return frozen?std::optional<int>(neutralTown?1:0):std::nullopt;}
}
