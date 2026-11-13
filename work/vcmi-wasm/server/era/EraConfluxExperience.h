/* Source355 independent p/a records in file order. GPL-2.0-or-later. */
#pragma once
#include "EraConfluxRuntime.h"
#include "../../lib/era/EraConfluxCaster.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
namespace era_compat_server
{
inline void confluxExperienceCasts(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,bool after)
{
    if(!conflux355(actor) || !actor->alive() || !target || !target->alive())return;
    const int rank=actor->base?std::clamp(actor->base->getExpRank(),0,10):0;
    const int chance=5+5*rank;
    auto side=actor->unitSide();
    if(actor->isHypnotized())side=side==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
    const auto currentSide=era_compat::confluxActiveSide(battle);
    era_compat::ConfluxSideScope context(currentSide,1);
    //71D939 tests both alive ONCE before its14-record loop. Each matching row
    //still consumes its rolls after an earlier spell kills either participant.
    const std::array<int,2> rows=after?std::array<int,2>{17,16}:std::array<int,2>{21,23};
    for(const int id:rows)
    {
        if(handler.getRandomGenerator().nextInt(1,100)>chance)continue;
        const auto * spell=SpellID(id).toSpell();
        spells::AbilityCaster ability(actor,3);
        era_compat::ConfluxCaster caster(&ability,battle.battleGetFightingHero(currentSide),battle.sideToPlayer(side));
        spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell);
        cast.eraExperiencePreAttack=true;cast.setSpellLevel(3);
        const int power=era_compat::experienceAttackPower(battle.battleActiveUnit(),id);
        cast.setEffectPower(power);cast.setEffectDuration(power);
        auto mechanics=spell->battleMechanics(&cast);
        {
            era_compat::ConfluxResistanceScope primaryQuery(true,side);
            const bool receptive=era_compat::sourceSpellContextAllows(battle,target,spell)&&mechanics->isReceptive(target);
            const int accuracy=receptive?era_compat::statusRawAccuracy(battle,target):0;
            if(handler.getRandomGenerator().nextInt(1,100)>accuracy)continue;
        }
        // Area dispatch5A4C80 performs additional per-victim hero-context rolls;
        // single-target17/16 skips another lottery because initialkind1 does.
        spells::Target destination;destination.emplace_back(target);
        cast.cast(handler.spellcastEnvironment(),destination);
    }
}
}
