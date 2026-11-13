/* Optional original346/347 direct WoG_CastSpell event envelopes.
 * Source tables.cpp after_retaliation441B62, aftermelee441C01, Defend479231.
 * No runtime call sites/admission are installed by this header alone.
 * GPL-2.0-or-later. */
#pragma once
#include "EraStatusAttacks.h"
#include "../../lib/era/EraPrimordialPolicies.h"
#include "../../lib/era/EraConfluxCaster.h"
#include "../../lib/era/EraExperienceAttackSpells.h"
#include <array>

namespace era_compat_server
{
inline int primordialActorSource(const CStack * actor)
{
    if(!actor)return 0;
    const auto & key=actor->creatureId().toCreature()->getJsonKey();
    if(!era_compat::PrimordialPolicies::get().owns(key))return 0;
    return key=="tum-era:eraCreature346"?346:347;
}

inline void primordialDirectEventCast(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,int spell,bool queryPrimary)
{
    if(!target || !target->alive())return;
    const auto side=era_compat::confluxActiveSide(battle);
    if(side!=BattleSide::ATTACKER && side!=BattleSide::DEFENDER)return;
    era_compat::ConfluxSideScope context(side,1);
    const int power=era_compat::experienceAttackPower(battle.battleActiveUnit(),spell);
    // AfterDefend29 has no canSpellBeCast guard. It must apply even to the
    // actor's intrinsic magic-immunity4. Keep the existing native timed effect
    // application/packet path and explicit source current power/duration.
    if(spell==29 && !queryPrimary)
    {
        applySourceStatus(handler,battle,actor,target,SpellID(29),3,battle.sideToPlayer(side),power);
        return;
    }
    spells::AbilityCaster ability(actor,3);
    era_compat::ConfluxCaster caster(&ability,battle.battleGetFightingHero(side),battle.sideToPlayer(side));
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,SpellID(spell).toSpell());
    cast.eraExperiencePreAttack=true;
    cast.setSpellLevel(3);cast.setEffectPower(power);cast.setEffectDuration(power);
    if(queryPrimary)
    {
        // Original canSpellBeCast tests original physical target side against
        // CURRENT, not hypnotized allegiance; it tests positive FLOAT without
        // a percentage lottery. Area dispatch has its own per-victim rolls.
        // Only single IceBolt16 has negative target type. Area20/22 source
        // type0 permits a friendly primary (e.g. a real Berserk melee action).
        if((spell==16 && target->unitSide()==side)
            ||!era_compat::sourceSpellContextAllows(battle,target,SpellID(spell).toSpell())
            ||!SpellID(spell).toSpell()->battleMechanics(&cast)->isReceptive(target)
            ||era_compat::statusRawAccuracy(battle,target,true,BattleSide::NONE,true)<=0)return;
    }
    spells::Target destination;destination.emplace_back(target);
    cast.cast(handler.spellcastEnvironment(),destination);
}

inline void primordialAfterMelee(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target)
{
    const int source=primordialActorSource(actor);
    if(!source || !target)return;
    // No actor-alive test: original441C01/441B62 only checks target alive,
    // separately BEFORE EACH cast. Keep direct caller CURRENT during retal.
    const std::array<int,2> spells=source==346?std::array<int,2>{22,22}:std::array<int,2>{20,16};
    for(const int spell:spells)
        if(target->alive())primordialDirectEventCast(handler,battle,actor,target,spell,true);
}

inline void primordialAfterDefend(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor)
{
    const int source=primordialActorSource(actor);
    if(!source || battle.battleTacticDist())return;
    const int spell=source==346?29:20;
    // 479231 has no prequery. A first area cast may kill the actor, in which
    // case its second line is skipped by the original fresh numberAlive test.
    for(int line=0;line<2;++line)
        if(actor->alive())primordialDirectEventCast(handler,battle,actor,actor,spell,false);
}
}
