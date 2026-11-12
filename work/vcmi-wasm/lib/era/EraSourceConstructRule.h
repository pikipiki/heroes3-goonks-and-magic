/* Amethyst repair membership is independent of creature nature. GPL-2.0-or-later. */
#pragma once
#include <string_view>
namespace era_bridge
{
constexpr bool sourceDefaultConstruct(std::string_view key)
{
    return key=="core:stoneGargoyle" || key=="core:obsidianGargoyle"
        || key=="core:ironGolem" || key=="core:stoneGolem"
        || key=="core:goldGolem" || key=="core:diamondGolem"
        || key=="core:crystalDragon";
}
constexpr bool sourceRepairTarget(bool sameSide,bool construct,int remaining,int initial)
{
    // A wounded first creature alone is insufficient: source checks numberAlive
    // below numberAtStart. Native effect targeting owns corpse/hex availability.
    return sameSide && construct && remaining>=0 && remaining<initial;
}
}
