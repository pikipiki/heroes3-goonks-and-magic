/* Original351/352 c#54 only. No shared existing selector behavior changed. */
#pragma once
#include "EraStatusAttacks.h"
#include "../../lib/era/EraCSlowSelector.h"
#include "../../lib/era/EraExperienceAttackSpells.h"
namespace era_compat_server
{
inline bool sourceCSlowExperienceImmunity(const CStack * target)
{
    const auto xp=Selector::sourceTypeSel(BonusSource::STACK_EXPERIENCE);
    if(target->hasBonus(xp.And(Selector::typeSubtype(BonusType::SPELL_IMMUNITY,BonusSubtypeID(SpellID(54))))))return true;
    if(target->valOfBonuses(xp.And(Selector::type()(BonusType::ERA_NEGATIVE_SPELL_LEVEL_IMMUNITY)))>=1)return true;
    if(target->valOfBonuses(xp.And(Selector::type()(BonusType::LEVEL_SPELL_IMMUNITY)))>=1)return true;
    for(const auto type:{BonusType::NEGATIVE_EFFECTS_IMMUNITY,BonusType::SPELL_SCHOOL_IMMUNITY})
        for(const auto school:{SpellSchool::ANY,SpellSchool::EARTH})
            if(target->hasBonus(xp.And(Selector::typeSubtype(type,BonusSubtypeID(school)))))return true;
    return false;
}
inline bool selectSourceCSlow(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor,const CStack * target,int chanceOverride=-1)
{
    era_bridge::CSlowSnapshot s;s.chanceOverride=chanceOverride;s.rank=statusRank(actor);s.actorAlive=actor->alive();s.targetAlive=target&&target->alive();
    s.orbOfInhibition=statusEitherArtifact(battle,126);s.cursedGround=statusCursedGround(battle);s.orbOfVulnerability=statusEitherArtifact(battle,93);
    if(target)
    {
        s.targetSourceId=StatusAttacks::get().id(target->creatureId().toCreature()->getJsonKey());
        const auto mirror=target->getBonuses(Selector::type()(BonusType::MAGIC_MIRROR).And(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(36)))));
        s.mirrorActive=!mirror->empty();s.mirrorThreshold=mirror->totalValue();
        s.alreadySlowed=target->hasBonus(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(54))));
        const auto * hero=battle.battleGetFightingHero(target->unitSide());
        s.heroResistance=statusCHeroResistance(hero);s.artifact134=statusHasArtifact(hero,134);
        // Source75C3B6 racial constants are separate from target's XP W rows.
        s.creatureResistance=target->valOfBonuses(Selector::type()(BonusType::MAGIC_RESISTANCE).And(Selector::sourceTypeSel(BonusSource::STACK_EXPERIENCE)));
        s.negativeExperienceImmunity=sourceCSlowExperienceImmunity(target);
        if(s.targetSourceId<0)
        {
            // Additional Goonk/mod species retain their intrinsic native immunity.
            s.creatureResistance+=target->valOfBonuses(Selector::type()(BonusType::MAGIC_RESISTANCE).And(Selector::sourceTypeSel(BonusSource::CREATURE_ABILITY)));
            StatusAttackCaster caster(actor,0,battle.battleGetOwner(actor));
            spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,SpellID(54).toSpell());
            cast.setSpellLevel(0);cast.setEffectPower(3);cast.setEffectDuration(3);
            s.foreignNativeRejected=!SpellID(54).toSpell()->battleMechanics(&cast)->isReceptive(target);
        }
    }
    int rejectionEffect=0;
    const bool result=era_bridge::selectSourceCSlow(s,[&](int lo,int hi){return handler.getRandomGenerator().nextInt(lo,hi);},&rejectionEffect);
    if(rejectionEffect)emitSourceStatusRejection(handler,battle,target,rejectionEffect);
    return result;
}
inline void applySourceCSlow(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,PlayerColor owner)
{
    // Queued kind1 invokes5A0145 on CURRENT manager active stack, including
    // retaliation. Source352 multiplier0 produces an actual duration0.
    const int power=era_compat::experienceAttackPower(battle.battleActiveUnit(),54);
    StatusAttackCaster caster(actor,0,owner);
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,SpellID(54).toSpell());
    cast.setSpellLevel(0);cast.setEffectPower(power);cast.setEffectDuration(power);
    BattleSpellCast packet;
    packet.battleID=battle.getBattle()->getBattleID();packet.activeCast=false;
    packet.side=battle.playerToSide(owner);packet.spellID=SpellID(54);packet.tile=target->getPosition();
    packet.affectedCres.insert(target->unitId());packet.casterStack=actor?actor->unitId():-1;packet.castByHero=false;
    handler.sendAndApply(packet);
    //444A33 removes Haste53 before applying Slow for EVERY power.
    // applyEffects intentionally skips the generic native counter stage.
    const auto haste=target->getBonuses(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(53))));
    std::vector<Bonus> removed;for(const auto & bonus:*haste)removed.push_back(*bonus);
    if(!removed.empty())
    {
        SetStackEffect effect;effect.battleID=battle.getBattle()->getBattleID();
        effect.toRemove.emplace_back(target->unitId(),std::move(removed));handler.sendAndApply(effect);
    }

    if(power!=0)
    {
        spells::Target aim;aim.emplace_back(target);
        cast.applyEffects(handler.spellcastEnvironment(),aim,false,true);
        if(!target->hasBonusOfType(BonusType::SIEGE_WEAPON))
        {
            //448A2E..448A32 clamps a slowed moving stack to minimum1.
            // Native core Slow can otherwise reduce baseSpeed1 to0. Keep
            // the floor attached to the same spell/duration for Haste/Dispel.
            Bonus floor;floor.type=BonusType::STACKS_SPEED;floor.val=1;
            floor.valType=BonusValueType::INDEPENDENT_MAX;floor.hidden=true;
            floor.source=BonusSource::SPELL_EFFECT;floor.sid=BonusSourceID(SpellID(54));
            floor.duration=BonusDuration::N_TURNS;floor.turnsRemain=power;
            floor.stacking="eraSourceCSlowFloor:v1";
            SetStackEffect effect;effect.battleID=battle.getBattle()->getBattleID();
            effect.toAdd.emplace_back(target->unitId(),std::vector<Bonus>{floor});handler.sendAndApply(effect);
        }
    }
    StacksInjured animation;animation.battleID=battle.getBattle()->getBattleID();handler.sendAndApply(animation);
}
}
