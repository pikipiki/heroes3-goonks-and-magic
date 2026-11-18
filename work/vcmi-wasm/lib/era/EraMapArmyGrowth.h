#pragma once
#include "EraMapArmyGrowthRules.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../mapping/CMap.h"
#include "../gameState/CGameState.h"
#include "../json/JsonNode.h"
#include <array>
#include <set>
#include <vector>
#include <type_traits>
#include <stdexcept>
namespace era_compat::map_rules
{
template<typename Map>
inline auto sourceArmyHeroes(Map & map)
{
    using Hero=std::conditional_t<std::is_const_v<Map>,const CGHeroInstance,CGHeroInstance>;
    std::array<Hero *,156> result{};
    for(const auto & object:map.objects)
        if(auto * hero=dynamic_cast<Hero *>(object.get()))
        {
            const auto id=hero->getHeroTypeID().getNum();
            if(id>=0&&id<156&&!result[id])result[id]=hero;
        }
    for(int id=0;id<156;++id)
        if(!result[id])result[id]=map.tryGetFromHeroPool(HeroTypeID(id));
    return result;
}
inline void applyArmyGrowth(CGameState & gs,const JsonNode & next)
{
    const auto & previous=gs.getMap().eraGameplayState["mapRules"];
    const auto day=next["armyGrowthDay"].Integer();
    if(day<=previous["armyGrowthDay"].Integer())return;
    if(day<=1||!next["rules"]["116"].Bool()||!next["armyGrowth"].isVector())
        throw std::runtime_error("Invalid WoG army growth state");
    const auto heroes=sourceArmyHeroes(gs.getMap());
    struct Change{CGHeroInstance * hero;SlotID slot;int32_t count;};
    std::vector<Change> changes;
    std::set<std::pair<int,int>> seen;
    for(const auto & row:next["armyGrowth"].Vector())
    {
        const auto id=row["hero"].Integer(),slot=row["slot"].Integer();
        const auto old=row["before"].Integer(),count=row["count"].Integer();
        if(id<0||id>=156||slot<0||slot>=7||!heroes[id]||!seen.emplace(id,slot).second
            ||old<=0||old>=100000||count!=era_bridge::map_rules::dailyArmyCount(static_cast<int32_t>(old))||count<=old)
            throw std::runtime_error("Invalid WoG army growth entry");
        const SlotID position(static_cast<int>(slot));
        if(!heroes[id]->hasStackAtSlot(position)||heroes[id]->getStackCount(position)!=old)
            throw std::runtime_error("Stale WoG army growth entry");
        changes.push_back({heroes[id],position,static_cast<int32_t>(count)});
    }
    // Increasing count uses the native stack operation: total XP is retained
    // and therefore diluted over the larger group, including pooled heroes.
    for(const auto & change:changes)change.hero->setStackCount(change.slot,change.count);
}
}
