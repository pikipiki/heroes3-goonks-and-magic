/* Source-ID registry is the activation boundary, not native numeric IDs. */
#pragma once
#include "EraCreatureSpellImmunity.h"
#include "EraSourceSpellAccuracy.h"
VCMI_LIB_NAMESPACE_BEGIN
inline int sourceCreatureSpellImmunityId(const battle::Unit * target)
{
    return target?era_compat::StatusAttacks::get().id(target->creatureId().toCreature()->getJsonKey()):-1;
}
inline bool cancelsSourceCreatureSpellDamage(const battle::Unit * target,
    ::era_bridge::CreatureSpellDamageOrigin origin,bool primaryTarget=false)
{
    return ::era_bridge::cancelsCreatureSpellDamage(sourceCreatureSpellImmunityId(target),origin,primaryTarget);
}
VCMI_LIB_NAMESPACE_END
