/* Versioned day receipt, not an equipped conditional movement aura. */
#pragma once
#include "EraWayfarerArtifact.h"
#include "../bonuses/BonusParameters.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct WayfarerDayState{int day;bool onWater;};
inline std::optional<WayfarerDayState> wayfarerDayState(const CGHeroInstance & hero)
{
    const auto id=WayfarerArtifact::get().artifact();if(!id)return std::nullopt;
    const auto bonus=hero.getFirstBonus(Selector::type()(BonusType::ERA_SOURCE_ARTIFACT_STATE)
        .And(Selector::source(BonusSource::ARTIFACT,BonusSourceID(*id))));
    if(!bonus)return std::nullopt;
    if(!bonus->parameters)throw std::runtime_error("Missing original260 day receipt");
    const auto & data=bonus->parameters->toVector();
    if(data.size()!=4 || data[0]!=1 || data[1]!=260 || data[2]<1 || data[3]<0 || data[3]>1)
        throw std::runtime_error("Invalid original260 day receipt");
    return WayfarerDayState{data[2],data[3]!=0};
}
inline void resetWayfarerMaximumOnBoatTransition(CGHeroInstance & hero)
{
    const auto state=wayfarerDayState(hero);if(!state)return;
    const auto id=WayfarerArtifact::get().artifact();
    // Original49E331 and4A0CF8 recalculate the new layer's daily maximum.
    // Keep the receipt: changing layers must not issue another daily400.
    hero.removeBonuses([&](const Bonus * bonus)
    {
        if(bonus->type!=BonusType::MOVEMENT || bonus->source!=BonusSource::ARTIFACT
            || bonus->sid!=BonusSourceID(*id) || !bonus->parameters)return false;
        const auto & data=bonus->parameters->toVector();
        return data==std::vector<int32_t>{1,260,state->day,state->onWater?1:0};
    });
}
}
VCMI_LIB_NAMESPACE_END
