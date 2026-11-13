#pragma once
#include "EraXpTimed184Runtime.h"
#include "../../lib/era/EraSourceXpAdmission.h"
#include "../../lib/era/EraSourceXpStoredStats.h"
#include "../../lib/era/EraDragonFly241State.h"
namespace era_compat_server
{
inline XpTimed184Access sourceXpTimedAccess(CGameHandler & handler,const CBattleInfoCallback & battle)
{
 XpTimed184Access access;
 access.admitted=era_compat::sourceXpBattleAdmitted(battle);access.lifecycleInstalled=true;
 access.storedAttack=[](const battle::Unit & u){return era_compat::sourceXpStoredAttack(u);};
 access.storedDefense=[](const battle::Unit & u){return era_compat::sourceXpStoredDefense(u);};
 access.removeCanonicalCounter=[&handler,&battle](const battle::Unit & unit,int spell)
 {
  if(spell==45)
  {
   if(auto p=era_compat::sourceWeakness45RemovalPacket(battle.getBattle()->getBattleID(),&unit))handler.sendAndApply(*p);
   return;
  }
  if(era_bridge::xp184::supports(spell))removeXpTimed(handler,battle,unit,spell);
  if(spell==59||spell==60)
  {
   std::vector<Bonus> removed;
   const auto sourceBonusList25=unit.getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(spell))));
   for(const auto & b:*sourceBonusList25)
    if(!era_compat::sourceTimedOwnedTag(b->stacking)&&b->stacking.empty()&&!b->parameters&&!b->limiter&&!b->updater
       &&b->effectRange==BonusLimitEffect::NO_LIMIT&&(spell==59||b->turnsRemain>0)
       &&((spell==59&&b->type==BonusType::ATTACKS_NEAREST_CREATURE)
          ||(spell==60&&b->type==BonusType::HYPNOTIZED)))removed.push_back(*b);
   if(!removed.empty()){SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();packet.toRemove.emplace_back(unit.unitId(),std::move(removed));handler.sendAndApply(packet);}
   return;
  }
  const auto * stack=dynamic_cast<const CStack *>(&unit);
  if(!stack)throw std::runtime_error("Original XP removal requires concrete stack");
  if(spell==41||spell==53)
  {
   const auto old=era_compat::captureDragonFly241Effects(*stack);
   if(old.durations[spell]>0)
   {
    auto packet=era_compat::dragonFly241RemovalPacket(battle.getBattle()->getBattleID(),*stack,old,{spell});
    if(!packet.toRemove.empty()||!packet.toAdd.empty())handler.sendAndApply(packet);
   }
   return;
  }
  // Remaining Cure-only legacy slots retain their existing native carrier.
  // Remove local, timed, unextended canonical core roles; unrelated providers
  // and custom spell IDs keep their original native behavior.
  std::vector<Bonus> removed;
  const auto sourceBonusList49=unit.getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(spell))));
  for(const auto & b:*sourceBonusList49)
  {
   if(b->turnsRemain<=0||!era_compat::dragonFly241CanonicalShape(*b))continue;
   const bool health=(spell==71||spell==75)&&b->type==BonusType::STACK_HEALTH;
   const bool forget=spell==61&&b->type==BonusType::FORGETFULL;
   if(health||forget)removed.push_back(*b);
  }
  if(!removed.empty()){SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();packet.toRemove.emplace_back(unit.unitId(),std::move(removed));handler.sendAndApply(packet);}
 };
 // Exact original applications are adopted at application time by the library
 // hooks. Foreign native providers remain independent rather than being erased
 // because they happen to share an original spell ID.
 access.removeNativeCureCompatibility=[&handler,&battle](const battle::Unit & unit,int spell)
 {
  const auto * descriptor=SpellID(spell).toSpell();
  if(!descriptor||descriptor->isPersistent()||descriptor->isAdventure())return;
  const auto polarity=descriptor->getPositiveness();
  if(boost::logic::indeterminate(polarity)||polarity)return;
  std::vector<Bonus> removed;
  const auto sourceBonusList68=unit.getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(spell))));
  for(const auto & b:*sourceBonusList68)
   if(!era_compat::sourceTimedOwnedTag(b->stacking)&&!era_bridge::weakness45OwnedTag(b->stacking))removed.push_back(*b);
  if(!removed.empty()){SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();packet.toRemove.emplace_back(unit.unitId(),std::move(removed));handler.sendAndApply(packet);}
 };
 access.preserveNativeCoexistence=[](const battle::Unit &,int,const std::vector<Bonus> &){return true;};
 return access;
}
}
