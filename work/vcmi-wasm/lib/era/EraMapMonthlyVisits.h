#pragma once
#include "EraMapMonthlyVisitRules.h"
#include "EraMapArmyGrowth.h"

namespace era_compat::map_rules
{
inline void applyMonthlyVisits(CGameState & gs,const JsonNode & next)
{
    const auto day=next["visitsResetDay"].Integer();
    if(day<=gs.getMap().eraGameplayState["mapRules"]["visitsResetDay"].Integer())return;
    if(!next["rules"]["123"].Bool()||!era_bridge::map_rules::monthlyVisitDay(day))
        throw std::runtime_error("Invalid WoG monthly visit state");
    // Only hero-local visit flags are reset. Player discoveries, team scouting,
    // object rewards and heroes beyond HERO_LAST_WOG (155) remain intact.
    const auto & objects=gs.getMap().objects;
    for(auto * hero:sourceArmyHeroes(gs.getMap()))
        if(hero)era_bridge::map_rules::clearMonthlyVisits(hero->visitedObjects,[&](ObjectInstanceID id)
        {
            const auto index=id.getNum();
            return index>=0&&static_cast<std::size_t>(index)<objects.size()&&objects[index]
                ?objects[index]->ID.getNum():-1;
        });
}
}
