/* Source isCreatureConstruct: explicit table membership OR siege-weapon bit6. */
#pragma once
#include "EraSourceConstructRule.h"
#include "../battle/Unit.h"
#include "../CCreatureHandler.h"
#include "../bonuses/Bonus.h"
VCMI_LIB_NAMESPACE_BEGIN
inline bool isEraSourceConstruct(const battle::Unit * unit)
{
    if(!unit) return false;
    // Source FillTables13654..13655 initializes these original IDs, including
    // living Crystal Dragon133. Never derive membership from biological flags.
    const auto & key=unit->creatureId().toCreature()->getJsonKey();
    return ::era_bridge::sourceDefaultConstruct(key) || unit->hasBonusOfType(BonusType::ERA_SOURCE_CONSTRUCT)
        || unit->hasBonusOfType(BonusType::SIEGE_WEAPON);
}
VCMI_LIB_NAMESPACE_END
