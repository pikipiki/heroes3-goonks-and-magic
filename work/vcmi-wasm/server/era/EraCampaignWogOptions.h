#pragma once
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/era/EraMapExtraDwellingRules.h"
#include <optional>

namespace era_compat::source_options
{
inline std::optional<int> read(const IGameInfoCallback & callback,int option)
{
    // The global Potion Fountains script remains uninstalled. Campaign
    // battle potions use their separately validated source mechanisms.
    if(option==17)return 0;
    // Read the exact frozen per-game flag used by native purchases, visits,
    // income and save migration; never read a second global/default flag.
    if(option==36)return mithril::enabled(callback)?1:0;
    if(option==171)return mithril::weeklyEnabled(callback)?1:0;
    // Source option67 selects the extra dwelling species. The separate
    // Neutral Town gameplay pack is not enabled by exposing this frozen flag.
    if(option==67)
    {
        const auto & saved=callback.gameState().getMap().eraGameplayState["mapRules"];
        return era_bridge::map_rules::extraDwellingOption(saved.isStruct(),saved["sourceOptions"]["67"].Bool());
    }
    return std::nullopt;
}
}
