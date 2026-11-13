/* Amethyst355 event casts; source441C01/479231/443E36. GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraConfluxPolicies.h"
#include "../../lib/era/EraConfluxCaster.h"
#include "../../lib/era/EraExperienceAttackSpells.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/battle/BattleInfo.h"
#include "../../lib/gameState/CGameState.h"

namespace era_compat_server
{
inline bool conflux355(const CStack * actor)
{return actor && era_compat::ConfluxPolicies::get().is355(actor->creatureId().toCreature()->getJsonKey());}
inline void confluxAutomaticCast(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const battle::Unit * target,int spell,int power)
{
    if(!target || !target->alive())return;
    // AfterWound temporarily forces the injured PHYSICAL side. The ordinary
    // after-action hooks retain CURRENT active side, including Hypnotize.
    auto side=actor->unitSide();
    if(spell!=29){const auto * active=battle.battleActiveUnit();if(active){side=active->unitSide();if(active->isHypnotized())side=side==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;}}
    era_compat::ConfluxSideScope context(side,1);
    spells::AbilityCaster ability(actor,0);
    era_compat::ConfluxCaster caster(&ability,nullptr,battle.sideToPlayer(side));
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,SpellID(spell).toSpell());
    cast.eraExperiencePreAttack=true; // Source kind1 direct singles have no second resistance lottery.
    cast.setSpellLevel(0);cast.setEffectPower(power);cast.setEffectDuration(power);
    spells::Target destination;destination.emplace_back(target);
    if(spell==15 && (!SpellID(spell).toSpell()->battleMechanics(&cast)->isReceptive(target)
        || era_compat::statusRawAccuracy(battle,target)<=0))return; //canSpellBeCast: probability>0, no draw.
    cast.cast(handler.spellcastEnvironment(),destination);
}
inline void confluxAfterDefend(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor)
{
    if(!conflux355(actor) || !actor->alive() || battle.battleTacticDist())return;
    confluxAutomaticCast(handler,battle,actor,actor,13,actor->getCount());
}
inline void confluxAfterMelee(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target)
{
    if(!conflux355(actor) || !target || !target->alive())return;
    // Source does not test caster survival here. A dead primary stack can
    // still supply power0 to a surviving target; do not impose a new alive gate.
    if(!era_compat::sourceSpellContextAllows(battle,target,SpellID(15).toSpell()))return;
    confluxAutomaticCast(handler,battle,actor,target,15,
        era_compat::experienceAttackPower(battle.battleActiveUnit(),15));
}
inline void confluxAfterWounds(CGameHandler & handler,const CPackForClient & pack)
{
    if(!era_compat::ConfluxPolicies::get().enabled())return;
    BattleID id=BattleID::NONE;std::vector<const BattleStackAttacked *> wounds;
    if(const auto * attack=dynamic_cast<const BattleAttack *>(&pack))
    {id=attack->battleID;for(const auto & hit:attack->bsa)wounds.push_back(&hit);}
    else if(const auto * injured=dynamic_cast<const StacksInjured *>(&pack))
    {id=injured->battleID;for(const auto & hit:injured->stacks)wounds.push_back(&hit);}
    if(wounds.empty())return;
    const auto * state=handler.gameState().getBattle(id);if(!state)return;
    const CBattleInfoCallback & battle=*state;
    for(const auto * hit:wounds)
    {
        const auto * actor=battle.battleGetStackByID(hit->stackAttacked);
        if(!conflux355(actor) || !actor->alive())continue;
        // WoG_CastSpell_Monster temporarily replaces the source manager stack
        // with this injured355, so duration uses its REMAINING count.
        confluxAutomaticCast(handler,battle,actor,actor,29,actor->getCount());
    }
}
}
