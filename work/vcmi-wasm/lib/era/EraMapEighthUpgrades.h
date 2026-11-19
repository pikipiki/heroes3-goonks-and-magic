#pragma once
#include "EraMapEighthUpgradeRules.h"
#include "EraMapArmyGrowth.h"
#include "EraSourceCreatureLevels.h"
#include "../CCreatureHandler.h"
#include <limits>

namespace era_compat::map_rules
{
inline int32_t eighthUpgradeExperience(const CStackInstance & stack,const CCreature & target)
{
    const auto experience=stack.getAverageExperience();
    const auto oldMaximum=stack.getMaxExperiencePerUnit();
    CStackInstance next(stack.cb,target.getId(),stack.getCount(),true);
    const auto newMaximum=next.getMaxExperiencePerUnit();
    if(experience<std::numeric_limits<int32_t>::min()||experience>std::numeric_limits<int32_t>::max()
        ||oldMaximum>std::numeric_limits<int32_t>::max()||newMaximum>std::numeric_limits<int32_t>::max())
        throw std::runtime_error("WoG eighth upgrade experience outside source words");
    return era_bridge::map_rules::eighthUpgradeExperience(experience,stack.getCount(),oldMaximum,newMaximum);
}
inline bool eighthUpgradeHasQuantity(const CGHeroInstance & hero,int source)
{
    std::array<int32_t,7> matching{};
    for(int slot=0;slot<7;++slot)
        if(const auto * stack=hero.getStackPtr(SlotID(slot)))
            if(era_bridge::sourceCreatureIdForLevel(stack->getType()->getJsonKey())==source)
                matching[slot]=stack->getCount();
    return era_bridge::map_rules::eighthUpgradeHasQuantity(matching);
}
inline void applyEighthUpgrades(CGameState & gs,const JsonNode & next)
{
    const auto & previous=gs.getMap().eraGameplayState["mapRules"];
    const auto day=next["eighthUpgradeDay"].Integer();
    if(day<=previous["eighthUpgradeDay"].Integer())return;
    if(day<=1||!next["rules"]["125"].Bool()||!next["eighthUpgrades"].isVector())
        throw std::runtime_error("Invalid WoG eighth upgrade state");
    const auto heroes=sourceArmyHeroes(gs.getMap());
    struct Change {CGHeroInstance * hero;SlotID slot;CreatureID target;int32_t experience;};
    std::vector<Change> changes;
    std::set<std::pair<int,int>> seen;
    for(const auto & row:next["eighthUpgrades"].Vector())
    {
        const auto id=row["hero"].Integer(),slot=row["slot"].Integer();
        if(id<0||id>=156||slot<0||slot>=7||!heroes[id]||!seen.emplace(id,slot).second)
            throw std::runtime_error("Invalid WoG eighth upgrade slot");
        const SlotID position(static_cast<int>(slot));
        const auto * stack=heroes[id]->getStackPtr(position);
        const CreatureID target(row["target"].Integer());
        const auto source=stack?era_bridge::sourceCreatureIdForLevel(stack->getType()->getJsonKey()):std::nullopt;
        const auto expectedTarget=source?era_bridge::map_rules::eighthUpgradeTarget(*source):std::nullopt;
        if(!stack||!expectedTarget||!eighthUpgradeHasQuantity(*heroes[id],*source)
            ||era_bridge::sourceCreatureIdForLevel(target.toCreature()->getJsonKey())!=expectedTarget
            ||stack->getCreatureID().getNum()!=row["before"].Integer()
            ||stack->getCount()!=row["count"].Integer()
            ||stack->getAverageExperience()!=row["experienceBefore"].Integer()
            ||eighthUpgradeExperience(*stack,*target.toCreature())!=row["experience"].Integer())
            throw std::runtime_error("Stale WoG eighth upgrade entry");
        changes.push_back({heroes[id],position,target,static_cast<int32_t>(row["experience"].Integer())});
    }
    // Validate every row before mutation. Never merge or reorder matching slots.
    for(const auto & change:changes)
    {
        change.hero->setStackType(change.slot,change.target,true);
        change.hero->getStackPtr(change.slot)->restoreSourceExperience(change.experience);
    }
}
}
