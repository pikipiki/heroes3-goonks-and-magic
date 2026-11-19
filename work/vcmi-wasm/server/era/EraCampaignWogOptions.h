#pragma once
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/era/EraMapExtraDwellingRules.h"
#include "../../lib/filesystem/Filesystem.h"
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
    if(option==170)return mithril::resourceReplacementEnabled(callback)?1:0;
    if(option==149)return mithril::displaySourceOption(callback)?1:0;
    if(option==120||option==129||option==125||option==113||option==119||option==131||option==144)
    {
        const auto & saved=map_rules::state(callback);
        const auto code=std::to_string(option);
        const auto & choice=option==144?saved["sourceOptions"][code]:saved["rules"][code];
        if(saved.isStruct())return choice.Bool()?1:0;
        if(callback.getDate(Date::DAY)!=0)return 0;
        const auto path=JsonPath::builtin("config/wog-map-rules");
        const JsonNode configured=CResourceHandler::get()->existsResource(path)?JsonNode(path)["mapRules"]:JsonNode();
        const bool inherited=option==144?configured["sourceOptions"][code].Bool():configured[code].Bool();
        const auto setting=option==120?era_bridge::WogOption::PerpetualDarkness:option==129?era_bridge::WogOption::ShootersBecomeMelee:option==125?era_bridge::WogOption::AutomaticEighthUpgrades:option==113?era_bridge::WogOption::HalfCreaturePrices:option==119?era_bridge::WogOption::DoubleArtifacts:
            option==131?era_bridge::WogOption::TownsWithoutForts:era_bridge::WogOption::PreserveAiForts;
        return era_bridge::wogOptionEnabled(callback,setting,inherited)?1:0;
    }
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
