/* Original nine-town seven-to-eight stock layout compatibility. */
#pragma once
#include <array>
#include <string_view>
#include <vector>
namespace era_bridge
{
inline constexpr std::array<std::string_view,9> originalEighthTownFactions{{
    "core:castle","core:rampart","core:tower","core:inferno","core:necropolis",
    "core:dungeon","core:stronghold","core:fortress","core:conflux"}};
inline bool originalEighthTownFaction(std::string_view key)
{
    for(const auto faction:originalEighthTownFactions)if(faction==key)return true;
    return false;
}
template<typename Row>
bool restoreOriginalEighthTownStock(std::vector<Row> & rows,std::string_view faction,
    std::size_t configuredTiers,bool reservesPortal)
{
    if(!originalEighthTownFaction(faction) || configuredTiers!=8)return false;
    const bool dungeon=faction=="core:dungeon";
    if(reservesPortal!=dungeon || rows.size()!=(dungeon?8u:7u))return false;
    // The saved Dungeon slot7 is the independent Portal reserve, including
    // an empty reserve when the Portal is unbuilt. Insert before it, not after.
    rows.insert(rows.begin()+7,Row{});
    return true;
}
}
