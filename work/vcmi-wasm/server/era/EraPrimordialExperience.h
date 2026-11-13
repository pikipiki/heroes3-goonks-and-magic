/* Optional346/347 XP p/a: one ordered source record per phase.
 * Source71D939/71DB27/5A0145. No runtime callsite installed here.
 * BEFORE: once per accepted primary action6/7 BEFOREmovement/firstStrike.
 * AFTER: each surviving primary/counter/additional hit BEFOREFireShield.
 * GPL-2.0-or-later. */
#pragma once
#include "EraPrimordialCastRuntime.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
namespace era_compat_server
{
inline void primordialExperienceCasts(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,bool after)
{
    const int id=primordialActorSource(actor);
    if(!id || !actor->alive() || !target || !target->alive())return;
    const int rank=actor->base?std::clamp(actor->base->getExpRank(),0,10):0;
    const int chance=10*rank;
    //71DA42 compares chance against1.0 BEFORE drawing the source ability RNG.
    //In particular rank0 contributes no random draw at all.
    if(chance<1)return;
    if(handler.getRandomGenerator().nextInt(1,100)>chance)return;
    const int spellId=id==346?(after?13:21):(after?20:16);
    const auto * spell=SpellID(spellId).toSpell();
    auto querySide=actor->unitSide();
    if(actor->isHypnotized())querySide=querySide==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
    const auto currentSide=era_compat::confluxActiveSide(battle);
    era_compat::ConfluxSideScope context(currentSide,1);
    spells::AbilityCaster ability(actor,3);
    era_compat::ConfluxCaster caster(&ability,battle.battleGetFightingHero(currentSide),battle.sideToPlayer(querySide));
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell);
    cast.eraExperiencePreAttack=true;cast.setSpellLevel(3);
    const int power=era_compat::experienceAttackPower(battle.battleActiveUnit(),spellId);
    cast.setEffectPower(power);cast.setEffectDuration(power);
    {
        era_compat::ConfluxResistanceScope query(true,querySide);
        const auto mechanics=spell->battleMechanics(&cast);
        //71DB27 calls5A8950: this is an INTEGER percentage lottery, even for
        //FireWall13 (not the later wall-trigger positive FLOAT query).
        //XP5A8950 forwards ignoreSide1. Do not impose ownership here:
        //Berserk friendlyIceBolt16 XP is legal, unlike directAfterMelee16.
        const bool receptive=era_compat::sourceSpellContextAllows(battle,target,spell)&&mechanics->isReceptive(target);
        const int accuracy=receptive?era_compat::statusRawAccuracy(battle,target):0;
        if(handler.getRandomGenerator().nextInt(1,100)>accuracy)return;
    }
    //5A0140kind1 skips the general dispatch lottery. Area20/21 then performs
    //its separate per-victim source draws;13 creates obstacles without another
    //resistance draw. Every matching row is independent of innate event spells.
    spells::Target destination;destination.emplace_back(target);
    cast.cast(handler.spellcastEnvironment(),destination);
}
}
