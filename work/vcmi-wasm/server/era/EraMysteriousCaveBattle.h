#pragma once
#include "../CGameHandler.h"
#include "../../lib/mapObjects/CGMysteriousCave.h"
#include "../../lib/CStack.h"
#include "../../lib/battle/CUnitState.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../../lib/mapObjects/army/CArmedInstance.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include "../../lib/spells/CSpellHandler.h"
#include <limits>
namespace era_compat_server {
inline void initializeMysteriousCaveBattle(CGameHandler&handler,const CBattleInfoCallback&battle)
{
 for(const auto side:{BattleSide::ATTACKER,BattleSide::DEFENDER})
 {
  const auto*hero=battle.battleGetFightingHero(side);if(!hero)continue;
  const bool enchanted=CGMysteriousCave::heroDays(handler.gameInfo(),hero,"enchanted")>0;
  const bool speed=CGMysteriousCave::heroDays(handler.gameInfo(),hero,"speed")>0;
  const bool health=CGMysteriousCave::heroDays(handler.gameInfo(),hero,"health")>0;
  if(!enchanted&&!speed&&!health)continue;
  for(const auto*stack:battle.battleGetAllStacks(false))
  {
   // Source BF visits the original21slots on each side, not later summons.
   if(stack->unitSide()!=side||stack->sourceMassSlot()<0||stack->sourceMassSlot()>=21||!stack->alive())continue;
   if(enchanted)for(int spell:{53,48,27})
   {
    spells::BattleCast cast(&battle,stack,spells::Mode::PASSIVE,SpellID(spell).toSpell());
    cast.setSpellLevel(3);cast.setEffectDuration(999);cast.setEffectPower(0);
    spells::Target target;target.emplace_back(stack);
    cast.applyEffects(handler.spellcastEnvironment(),target,false,true);
   }
   SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();std::vector<Bonus> bonuses;
   if(speed&&stack->getMovementRange()>0)
   {
    Bonus b(BonusDuration::ONE_BATTLE,BonusType::STACKS_SPEED,BonusSource::OTHER,3,BonusSourceID());
    b.stacking="eraCave:initializedSpeed:v1";bonuses.push_back(std::move(b));
   }
   if(health)
   {
    const auto value=int64_t(stack->getMaxHealth())*2;
    if(value>std::numeric_limits<int32_t>::max())throw std::runtime_error("Cave doubled health outside positive signed32 domain");
    Bonus b(BonusDuration::ONE_BATTLE,BonusType::NONE,BonusSource::OTHER,static_cast<int>(value),BonusSourceID());
    b.hidden=true;b.stacking="eraCave:initializedHealth:v1";bonuses.push_back(std::move(b));
   }
   if(!bonuses.empty()){packet.toAdd.emplace_back(stack->unitId(),std::move(bonuses));handler.sendAndApply(packet);}
   if(health)
   {
    auto state=stack->acquireState();int64_t heal=int64_t(state->getCount())*state->getMaxHealth()-state->getAvailableHealth();
    if(heal>0){state->heal(heal,EHealLevel::HEAL,EHealPower::PERMANENT);BattleUnitsChanged changed;changed.battleID=packet.battleID;changed.changedStacks.emplace_back(stack->unitId(),UnitChanges::EOperation::RESET_STATE);state->save(changed.changedStacks.back().data);handler.sendAndApply(changed);}
   }
  }
 }
 const auto*hero=battle.battleGetFightingHero(BattleSide::ATTACKER);
 if(hero&&!battle.battleGetFightingHero(BattleSide::DEFENDER))
 {
  int64_t health=0;
  for(const auto&slot:battle.battleGetArmyObject(BattleSide::DEFENDER)->stacks)
   health+=int64_t(slot.second->getCreature()->getMaxHealth())*slot.second->getCount();
  CGMysteriousCave::recordNeutralHealth(handler,hero,health);
 }
}
}
