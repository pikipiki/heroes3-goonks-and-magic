#pragma once
#include "EraDwellingServices.h"
#include "../battle/Unit.h"
#include "../CCreatureHandler.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat {
inline bool dwellingHypnotist(const battle::Unit*unit){if(!unit)return false;const auto&key=unit->creatureId().toCreature()->getJsonKey();return DwellingServices::get().actor(274,key)||DwellingServices::get().actor(282,key);}
}
VCMI_LIB_NAMESPACE_END
