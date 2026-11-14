#pragma once
#include "EraDwellingServices.h"
#include "EraDwellingRule.h"
#include "../battle/Unit.h"
#include "../CCreatureHandler.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat {
inline int applyDwellingFlatHealth(const battle::Unit & unit,int prior)
{
 const auto key=unit.unitType()->getJsonKey();
 const int source=key=="tum-era:eraCreature309"?309:key=="tum-era:eraCreature310"?310:-1;
 if(!DwellingServices::get().actor(source,key))return prior;
 int addition=0,found=0;
 for(const auto & bonus:*unit.getBonusesOfType(BonusType::NONE))
  if(bonus->stacking=="sourceDwellingFlatHealth:v1"){
   if(++found>1||bonus->source!=BonusSource::STACK_EXPERIENCE||bonus->duration!=BonusDuration::PERMANENT||!bonus->hidden||bonus->valType!=BonusValueType::ADDITIVE_VALUE||bonus->effectRange!=BonusLimitEffect::NO_LIMIT||bonus->val<0||bonus->val>14)throw std::runtime_error("Invalid dwelling flat health carrier");
   addition=bonus->val;
  }
 return ::era_bridge::sourceDwellingFlatHealth(prior,addition);
}
}
VCMI_LIB_NAMESPACE_END
