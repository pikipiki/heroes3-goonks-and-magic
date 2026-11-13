/* Isolated compatibility path. All validation/RNG/casts remain native. */
#pragma once
#include "EraDragonFly241Runtime.h"
#include "../../lib/era/EraDragonFly241DispelScope.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/mapObjects/army/CArmedInstance.h"
namespace era_compat_server
{
inline bool castSourceDragonFly241CustomLate(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,bool direct78Handled)
{
 // Exact old handleAfterAttackCasting alive boundary, AFTER reflection. A
 // source78 proc that killed/changed either participant does not force a cast.
 if(!direct78Handled||!actor||!target||!actor->alive()||!target->alive()
     ||actor->creatureId().toCreature()->getJsonKey()!="third-upgrades:tumChaoticDragonFly")return false;
 const auto innate=actor->getBonuses(Selector::source(BonusSource::CREATURE_ABILITY,BonusSourceID(actor->creatureId()))
     .And(Selector::typeSubtype(BonusType::SPELL_AFTER_ATTACK,BonusSubtypeID(SpellID(78)))));
 if(innate->size()!=1||!era_compat::dragonFly241OwnedNativeDispel(*innate->front(),actor->creatureId()))
     throw std::runtime_error("Source241 custom late native provider changed");
 const auto * spell=SpellID(78).toSpell();
 spells::AbilityCaster caster(actor,1); // exact innate JSON basic1; no banner mastery merge.
 spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell);
 spells::Target aim;aim.emplace_back(target);
 era_compat::DragonFly241DispelCustomScope scope(&caster,target);
 auto mechanics=spell->battleMechanics(&cast);
 // Original native sequence: canBeCastAt THEN rollCombatAbility(ownerArmy,100)
 // THEN BattleCast.cast (retaining ordinary immunity/resistance/cast handling).
 if(!mechanics->canBeCastAt(aim))return false;
 const auto army=battle.getBattle()->getSideArmy(actor->unitSide())->id;
 if(!handler.randomizer->rollCombatAbility(army,100))return false;
 cast.cast(handler.spellcastEnvironment(),aim);
 return true;
}
}
