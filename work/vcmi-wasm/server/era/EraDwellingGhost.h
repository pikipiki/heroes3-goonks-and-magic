#pragma once
#include "../../lib/era/EraDwellingServices.h"
#include "../../lib/era/EraDwellingRule.h"
#include "../../lib/era/EraSourceSpellAccuracy.h"
#include "../../lib/battle/Unit.h"
#include "../../lib/battle/CUnitState.h"
inline battle::HealInfo applyEraDwellingGhost(battle::CUnitState & actor,const battle::Unit & target,
 int32_t rawDamage,int64_t killed)
{
 if(!era_compat::DwellingServices::get().actor(325,actor.unitType()->getJsonKey()))return {};
 int source=era_compat::StatusAttacks::get().id(target.unitType()->getJsonKey());
 if(source<0 && target.unitType()->getJsonKey().rfind("core:",0)==0)source=target.unitType()->getIndex();
 auto heal=::era_bridge::sourceGhost325Healing(rawDamage,target.getAvailableHealth(),source,
  killed,actor.getAvailableHealth(),actor.getCount(),actor.getMaxHealth());
 if(heal<=0)return {};
 return actor.heal(heal,EHealLevel::OVERHEAL,EHealPower::PERMANENT);
}
