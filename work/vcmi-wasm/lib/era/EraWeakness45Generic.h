/* Future optional generic45 application. Requires169/169b lifecycle already installed. */
#pragma once
#include "EraWeakness45GenericRule.h"
#include "EraWeakness45State.h"
#include "EraSourceXpAdmission.h"
#include "EraConfluxPolicies.h"
#include "../spells/ISpellMechanics.h"
#include "../entities/hero/CHero.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../CCreatureHandler.h"
#include "../battle/BattleInfo.h"
#include <vcmi/ServerCallback.h>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool sourceWeakness45GenericEnabled(const CBattleInfoCallback & battle,const battle::Unit * target)
{
 if(target&&readSourceWeakness45(target).owned)return true;
 return sourceXpBattleAdmitted(battle);
}
inline bool sourceWeakness45GenericCounterPreserved(const spells::Mechanics & mechanics,
 const battle::Unit * target,const Bonus & candidate)
{
 // Ordinary native spell45 counters and every non-43 custom counter remain
 // unchanged outside this narrowly enrolled battle/owned45 state.
 return mechanics.getSpellId()==SpellID(45)&&candidate.source==BonusSource::SPELL_EFFECT
   &&candidate.sid==BonusSourceID(SpellID(43))
   &&sourceWeakness45GenericEnabled(*mechanics.battle(),target);
}
inline bool applySourceWeakness45Generic(ServerCallback * server,const spells::Mechanics * m,
 const battle::Unit * target,std::vector<Bonus> & nativeBuffer,int32_t nativeDuration,
 bool nativeOriginalPeculiarApplied,bool nativeFixedValueApplied)
{
 if(m->getSpellId()!=SpellID(45)||!sourceWeakness45GenericEnabled(*m->battle(),target))return false;
 const auto canonical=[](const Bonus & b){return b.type==BonusType::PRIMARY_SKILL
    &&b.subtype==BonusSubtypeID(PrimarySkill::ATTACK)&&b.valType==BonusValueType::ADDITIVE_VALUE
    &&b.effectRange==BonusLimitEffect::NO_LIMIT;};
 const auto it=std::find_if(nativeBuffer.begin(),nativeBuffer.end(),canonical);
 if(it==nativeBuffer.end())return false;
 if(std::count_if(nativeBuffer.begin(),nativeBuffer.end(),canonical)!=1)
  throw std::runtime_error("Ambiguous canonical source45 member");
 const Bonus bonus=*it;
 const auto old=readSourceWeakness45(target);
 if(old.foreignWeakness)throw std::runtime_error("Native45 predates optional source enrollment");
 const int kind=confluxCastKind.value_or(m->isHeroCast()?0:(m->caster->getHeroCaster()?2:1));
 const CGHeroInstance * hero=nullptr;
 if(kind!=1)
 {
  auto side=confluxActiveSide(*m->battle());
  if(side==BattleSide::NONE)side=m->battle()->playerToSide(m->getCasterColor());
  if(side!=BattleSide::NONE)hero=m->battle()->battleGetFightingHero(side);
 }
 const std::string heroKey=hero?hero->getHeroType()->getJsonKey():std::string{};
 const auto magnitude=era_bridge::weakness45GenericMagnitude({
  era_bridge::weakness45Signed(static_cast<uint32_t>(bonus.val)),
  target->creatureId().toCreature()->getJsonKey(),heroKey,target->creatureLevel(),kind,
  nativeOriginalPeculiarApplied,nativeFixedValueApplied});
 const auto change=era_bridge::weakness45ApplyGeneric(old.state,old.storedAttack,
  nativeDuration,m->getEffectLevel(),magnitude);
 auto packet=sourceWeakness45Packet(m->battle()->getBattle()->getBattleID(),target,old,change.state);
 if(!packet.toRemove.empty()||!packet.toAdd.empty())server->apply(packet);
 nativeBuffer.erase(it);
 return true;
}
}
VCMI_LIB_NAMESPACE_END
