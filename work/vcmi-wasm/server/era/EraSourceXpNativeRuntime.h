#pragma once
#include "../../lib/era/EraXpTimed184Hooks.h"
#include "../../lib/era/EraSourceXpAdmission.h"
#include "../../lib/era/EraSourceXpStoredStats.h"
#include "EraStatusAttacks.h"
#include "../../lib/era/EraDwellingServices.h"
namespace era_compat_server
{
inline thread_local std::optional<bool> sourceXpNativeProvider;
class SourceXpNativeProviderScope
{
 std::optional<bool> previous;
public:
 explicit SourceXpNativeProviderScope(bool original):previous(sourceXpNativeProvider){sourceXpNativeProvider=original;}
 ~SourceXpNativeProviderScope(){sourceXpNativeProvider=previous;}
 SourceXpNativeProviderScope(const SourceXpNativeProviderScope&)=delete;
};
inline void finishSourceXpPrimaryAttack(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor)
{
 if(!actor)return;
 if(auto packet=era_compat::removeXpTimed184Packet(battle.getBattle()->getBattleID(),*actor,59))handler.sendAndApply(*packet);
}
inline era_compat::XpTimed184NativeAccess sourceXpNativeAccess(const CBattleInfoCallback & battle)
{
 era_compat::XpTimed184NativeAccess access;access.admitted=era_compat::sourceXpBattleAdmitted(battle);
 if(era_compat::DwellingServices::get().enabled(316))
 {
  const auto origin=BonusSourceID(CreatureID(CreatureID::decode("tum-era:eraCreature316")));
  const auto from316=Selector::source(BonusSource::CREATURE_ABILITY,origin);
  for(const auto * unit:battle.battleGetAllStacks(false))
  {
   const auto & key=unit->creatureId().toCreature()->getJsonKey();
   if(key=="tum-era:eraCreature316" || (key=="wake-of-gods.creatures:wogSorceress"
      &&unit->hasBonus(from316.And(Selector::type()(BonusType::ERA_SOURCE_UNOWNED_STACK)))
      &&unit->hasBonus(from316.And(Selector::type()(BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON)))))
    access.allowSorceressForgetfulness=true;
  }
 }
 access.storedAttack=[](const battle::Unit & u){return era_compat::sourceXpStoredAttack(u);};
 access.storedDefense=[](const battle::Unit & u){return era_compat::sourceXpStoredDefense(u);};
 access.originalApplication=[](const spells::Mechanics & m,const battle::Unit &)
 {
  if(sourceXpNativeProvider)return *sourceXpNativeProvider;
  if(m.isHeroCast())return true;
  const auto * unit=m.battle()->battleGetStackByID(m.caster->getCasterUnitId(),false);
  if(unit)return era_compat::StatusAttacks::get().id(unit->creatureId().toCreature()->getJsonKey())>=0;
  return m.caster->getHeroCaster()!=nullptr;
 };
 access.preserveNativeCoexistence=[](const battle::Unit &,int,const std::vector<Bonus> &){return true;};
 return access;
}
}
