#pragma once
#include "EraStatusHealth.h"
#include "../bonuses/IBonusBearer.h"
#include "../bonuses/BonusSelector.h"
#include "../bonuses/BonusList.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool sourceStatusUsesProfile(const IBonusBearer & unit)
{
    // The explicit XP-health adapter also owns canonical status ordering for its unit.
    if(!unit.hasBonusOfType(BonusType::ERA_SOURCE_STATUS_HEALTH)
        && !unit.hasBonusOfType(BonusType::ERA_EXPERIENCE_HEALTH_PERCENT))return false;
    const auto ages=unit.getBonuses(Selector::source(BonusSource::SPELL_EFFECT,SpellID(SpellID::AGE))
        .And(Selector::type()(BonusType::STACK_HEALTH)));
    for(const auto & age:*ages)
        if(age->val!=-50 || age->valType!=BonusValueType::PERCENT_TO_ALL)
            return false; // Preserve other mods' custom Aging strengths.
    const auto poison=unit.getBonus(Selector::source(BonusSource::SPELL_EFFECT,SpellID(SpellID::POISON))
        .And(Selector::type()(BonusType::STACK_HEALTH)));
    // Other mods' noncanonical poison retains the entire native HP/clock path.
    return !poison || (::era_bridge::sourcePoisonPercentSupported(-poison->val)
        && unit.valOfBonuses(BonusType::POISON)==50);
}
}
VCMI_LIB_NAMESPACE_END
