#pragma once
#include "../../lib/era/EraMithrilModel.h"
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
    return std::nullopt;
}
}
