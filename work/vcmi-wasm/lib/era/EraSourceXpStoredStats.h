#pragma once
#include "EraWeakness45State.h"
#include "EraSourceDefendState.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline int sourceXpStoredAttack(const battle::Unit & unit)
{return readSourceWeakness45(&unit).storedAttack;}
inline int sourceXpStoredDefense(const battle::Unit & unit)
{
 const auto native=Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE))
    .And(Selector::effectRange()(BonusLimitEffect::NO_LIMIT))
    .And([](const Bonus * b){return b->stacking!=sourceDefendTag&&!xpTimed184StatProjection(b);});
 const auto state=sourceDefendState(unit);
 return era_bridge::sourceDefendAdd(xpTimed184DefenseAfterNative(
    era_bridge::sourceDefendSigned(static_cast<uint32_t>(unit.valOfBonuses(native))),unit),state?(*state)[3]:0);
}
}
VCMI_LIB_NAMESPACE_END
