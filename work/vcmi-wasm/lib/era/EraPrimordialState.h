/* Source347 initial bit27, isolated from native defending/willMove.
 * The original heap/ctor/reset leaves4DC uninitialized. Per user policy, the
 * port defines that INITIAL savedDEFdelta as0; ordinary Defend is unchanged. */
#pragma once
#include "EraPrimordialPolicies.h"
#include "EraPrimordialStateRule.h"
#include "../CCreatureHandler.h"
#include "../bonuses/Bonus.h"
#include "../bonuses/BonusParameters.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
template<typename Unit> const Bonus * primordialDefendingMarker(const Unit & unit)
{
    if(!PrimordialPolicies::get().is347(unit.creatureId().toCreature()->getJsonKey()))return nullptr;
    for(const auto & bonus:*unit.getBonusesOfType(BonusType::DEFENSIVE_STANCE))
        if(bonus->val==0&&bonus->hidden&&bonus->source==BonusSource::CREATURE_ABILITY
            &&bonus->sid==BonusSourceID(unit.creatureId())&&bonus->parameters
            &&era_bridge::primordialInitialDefendingState(bonus->parameters->toVector())>=0)
            return bonus.get();
    return nullptr;
}
template<typename Unit> bool primordialInitialDefending(const Unit & unit)
{
    const auto * marker=primordialDefendingMarker(unit);
    return marker&&era_bridge::primordialInitialDefendingState(marker->parameters->toVector())==1;
}
template<typename Unit> void initializePrimordialDefending(Unit & unit)
{
    if(!PrimordialPolicies::get().is347(unit.creatureId().toCreature()->getJsonKey())
        ||primordialDefendingMarker(unit))return;
    auto marker=std::make_shared<Bonus>();marker->type=BonusType::DEFENSIVE_STANCE;
    marker->val=0;marker->hidden=true;marker->duration=BonusDuration::ONE_BATTLE;
    marker->source=BonusSource::CREATURE_ABILITY;marker->sid=BonusSourceID(unit.creatureId());
    marker->parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{1,347,27,1});
    unit.addNewBonus(marker);
}
}
VCMI_LIB_NAMESPACE_END
