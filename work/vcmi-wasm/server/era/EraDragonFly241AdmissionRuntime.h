#pragma once
#include "EraDragonFly241NativeLate.h"
#include "EraSourceDefendRuntime.h"
#include "../../lib/era/EraDragonFly241FrameRule.h"
namespace era_compat_server
{
using DragonFly241AttackFrame=era_bridge::Source241AttackFrame<battle::Unit,CStack>;
inline TConstBonusListPtr source241WithoutOwnedNativeDispel(const TConstBonusListPtr & bonuses,
 const battle::Unit * actor,const CStack * target)
{
 if(!DragonFly241AttackFrame::handles(actor,target))return bonuses;
 const auto * stack=dynamic_cast<const CStack *>(actor);auto filtered=std::make_shared<BonusList>();
 for(const auto & bonus:*bonuses)
  if(!suppressSourceDragonFly241NativeDispel(*bonus,stack,true))filtered->push_back(bonus);
 return filtered;
}
inline era_bridge::DragonFly241Result source241AfterPhysical(CGameHandler & handler,
 const CBattleInfoCallback & battle,const CStack * actor,const CStack * target)
{
 if(!actor||!era_compat::sourceXpBattleAdmitted(battle)
   ||actor->creatureId().toCreature()->getJsonKey()!="third-upgrades:tumChaoticDragonFly"
   ||!era_compat::SourceXpAdmissionPolicy::get().ownsActor(actor->creatureId().toCreature()->getJsonKey()))return{};
 if(!sourceDefendBattleEnrolled(battle))throw std::runtime_error("Source241 needs original stored DEFEND");
 const auto proxy=actor->getBonuses(Selector::source(BonusSource::CREATURE_ABILITY,BonusSourceID(actor->creatureId()))
    .And(Selector::typeSubtype(BonusType::SPELL_AFTER_ATTACK,BonusSubtypeID(SpellID(45)))));
 if(!proxy->empty())throw std::runtime_error("Source241 duplicate native Weakness provider");
 return runSourceDirectDispel241(handler,battle,actor,target,era_compat::confluxActiveSide(battle),{true,true,true});
}
}
