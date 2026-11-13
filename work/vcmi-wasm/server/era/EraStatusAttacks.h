/* Independently reconstructed WoG c#71/k#71 and Amethyst Age selector4.
 * Source evidence: h3era.exe 71D7A9/75B4CA/5A8950/71D939, tables.cpp selector4.
 * GPL-2.0-or-later. Opt-in policy; no Windows code is copied. */
#pragma once
#include "../../lib/era/EraStatusSelectors.h"
#include "../../lib/era/EraSourceSpellAccuracy.h"
#include "../../lib/era/EraSkeletonTransformations.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "../../lib/CStack.h"
#include "../../lib/BattleFieldHandler.h"
#include "../../lib/bonuses/BonusList.h"
#include "../../lib/entities/hero/CHero.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include "../../lib/spells/TargetCondition.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/json/JsonNode.h"
#include "../CGameHandler.h"
#include <map>
#include <set>
#include <optional>
#include <vstd/RNG.h>
namespace era_compat_server
{
using era_compat::StatusAttacks;
using era_compat::statusHasArtifact;
using era_compat::statusEitherArtifact;
using era_compat::statusThorgrim;
using era_compat::statusCHeroResistance;
using era_compat::statusSourceAura;
using era_compat::statusRawAccuracy;

class StatusAttackCaster final : public spells::AbilityCaster
{
    PlayerColor effectiveOwner;
    int sourceMastery;
    era_compat::ConfluxCastQueryScope sourceContext;
    static BattleSide sourceSide(const CStack * actor)
    {
        const auto side=actor->unitSide();
        return actor->isHypnotized()?(side==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER):side;
    }
public:
    StatusAttackCaster(const CStack * actor,int mastery,PlayerColor owner)
        : spells::AbilityCaster(actor,mastery),effectiveOwner(owner),sourceMastery(mastery),sourceContext(sourceSide(actor),1){}
    PlayerColor getCasterOwner() const override{return effectiveOwner;}
    int32_t getSpellSchoolLevel(const spells::Spell *,SpellSchool * = nullptr) const override{return sourceMastery;}
    int32_t getEffectLevel(const spells::Spell *) const override{return sourceMastery;}
};
inline bool statusLiving(const CStack * target)
{
    const auto * source=era_compat::SkeletonTransformations::get().find(target->creatureId().toCreature()->getJsonKey());
    // Explicit compatibility boundary: additional Goonk creatures retain native nature.
    return source?source->living:target->isLiving();
}
inline int statusRank(const CStack * actor)
{return actor->base?std::clamp(actor->base->getExpRank(),0,10):0;}
inline bool statusCursedGround(const CBattleInfoCallback & battle)
{
    const auto field=battle.battleGetBattlefieldType();
    return field!=BattleField::NONE && LIBRARY->battlefields()->getById(field)->getJsonKey()=="core:cursed_ground";
}
inline void emitSourceStatusRejection(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * target,int sourceEffect)
{
    BattleTriggerEffect packet;
    packet.battleID=battle.getBattle()->getBattleID();packet.stackID=target->unitId();
    packet.effect=sourceEffect==3?BonusType::MAGIC_MIRROR:BonusType::MAGIC_RESISTANCE;
    handler.sendAndApply(packet);
}
inline bool selectSourceCStatus(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,int sourceSpell)
{
    // 71D7A9 rolls before life checks; rank0 consumes no roll. Explicitly registered source c71/c75 actors only.
    const auto sourceActorId=StatusAttacks::get().id(actor->creatureId().toCreature()->getJsonKey());
    const int rank=std::clamp(statusRank(actor),0,10);
    const auto chance=sourceSpell==71 && sourceActorId==354 ? std::min(95,rank*10) : rank*(sourceSpell==75?8:5);
    auto & rng=handler.getRandomGenerator();
    if(chance==0 || !era_bridge::statusRollAccepts(chance,rng.nextInt(1,100)))return false;
    if(!actor->alive() || !target || !target->alive())return false;
    if(statusCursedGround(battle) || statusEitherArtifact(battle,126))return false;
    const auto id=StatusAttacks::get().id(target->creatureId().toCreature()->getJsonKey());
    if(era_bridge::sourceCAlwaysExcludedId(id))
    {
        emitSourceStatusRejection(handler,battle,target,78);
        return false; //75B5D6, independent of Orb93.
    }
    // 75B613 checks active spell36 before Recanter/other creature restrictions.
    const auto mirror=target->getBonuses(Selector::type()(BonusType::MAGIC_MIRROR)
        .And(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(36)))));
    if(!mirror->empty() && era_bridge::statusRollAccepts(mirror->totalValue(),rng.nextInt(1,50),50))
    {
        emitSourceStatusRejection(handler,battle,target,3);
        return false;
    }
    const bool orb=statusEitherArtifact(battle,93);
    const bool eligible=sourceSpell==75
        ?era_bridge::sourceCAgeEligible(statusEitherArtifact(battle,83),orb,target->hasBonusOfType(BonusType::UNDEAD),id)
        :era_bridge::sourceCPoisonEligible(statusEitherArtifact(battle,83),orb,target->hasBonusOfType(BonusType::UNDEAD),id);
    if(!eligible)return false;
    // Unknown extra creatures have no source blacklist entry. Preserve their
    // explicit native spell immunity instead of silently treating them as ERA.
    if(id<0)
    {
        StatusAttackCaster caster(actor,0,battle.battleGetOwner(actor));
        spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,SpellID(sourceSpell).toSpell());
        cast.setSpellLevel(0);cast.setEffectPower(3);cast.setEffectDuration(3);
        if(!SpellID(sourceSpell).toSpell()->battleMechanics(&cast)->isReceptive(target))return false;
    }
    if(target->hasBonus(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(sourceSpell)))))return false;
    (void)rng.nextInt(1,100); //75C204 weighted selector consumes a roll even with its sole candidate.
    const auto * hero=battle.battleGetFightingHero(target->unitSide()); //75CAAF uses original target+F4, not hypnosis.
    const auto resistance=statusHasArtifact(hero,134)?200:statusCHeroResistance(hero);
    if(resistance>0 && rng.nextInt(1,100)<=resistance)
    {
        emitSourceStatusRejection(handler,battle,target,78);
        return false;
    }
    return true;
}
inline bool selectSourceCPoison(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target)
{return selectSourceCStatus(handler,battle,actor,target,71);}
inline bool selectSourceCAge(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target)
{return selectSourceCStatus(handler,battle,actor,target,75);}
inline int statusPrimaryAccuracy(const CBattleInfoCallback & battle,const CStack * actor,
    const CStack * target,SpellID spell)
{
    if(!target || !target->alive() || !statusLiving(target))return 0;
    const int sourceId=StatusAttacks::get().id(target->creatureId().toCreature()->getJsonKey());
    if(spell.num==71 && (sourceId==30 || sourceId==31))return 0;
    if(spell.num==75 && target->hasBonusOfType(BonusType::UNDEAD))return 0;
    const auto * hero=battle.battleGetOwnerHero(target);
    if(spell.toSpell()->getLevel()<=4 && statusHasArtifact(hero,134))return 0;
    //44A1E8 gates134 by descriptorlevel<=4, including0. Age75 islevel5.
    StatusAttackCaster caster(actor,0,battle.battleGetOwner(actor));
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell.toSpell());
    cast.setSpellLevel(0);cast.setEffectPower(3);cast.setEffectDuration(3);
    const auto * factory=spells::TargetConditionItemFactory::getDefault();
    spells::TargetCondition condition;
    condition.absolute={factory->createAbsoluteSpell(),factory->createAbsoluteLevel()};
    condition.normal={factory->createElemental(),factory->createNormalLevel(),factory->createNormalSpell()};
    condition.negation={factory->createReceptiveFeature(),factory->createImmunityNegation()};
    // No JSON creatureNature exclusion: source ALIVE can include constructs271.
    if(!condition.isReceptive(spell.toSpell()->battleMechanics(&cast).get(),target))return 0;
    return statusRawAccuracy(battle,target);
}
inline bool statusPrimaryAccepts(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,SpellID spell)
{
    const auto threshold=statusPrimaryAccuracy(battle,actor,target,spell);
    //5A8950 ALWAYS consumes this roll, including a zero probability/immunity.
    return era_bridge::statusRollAccepts(threshold,handler.getRandomGenerator().nextInt(1,100));
}
inline void applySourceStatus(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,SpellID spell,int mastery,
    std::optional<PlayerColor> capturedOwner=std::nullopt,int sourcePower=3)
{
    const auto owner=capturedOwner.value_or(actor?battle.battleGetOwner(actor):PlayerColor::NEUTRAL);
    StatusAttackCaster caster(actor,mastery,owner);
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell.toSpell());
    cast.setSpellLevel(mastery);cast.setEffectPower(sourcePower);cast.setEffectDuration(sourcePower);
    BattleSpellCast packet;
    packet.battleID=battle.getBattle()->getBattleID();packet.activeCast=false;
    packet.side=battle.playerToSide(owner);packet.spellID=spell;packet.tile=target->getPosition();
    packet.affectedCres.insert(target->unitId());packet.casterStack=actor?actor->unitId():-1;packet.castByHero=false;
    handler.sendAndApply(packet);
    spells::Target aim;aim.emplace_back(target);
    // Validation and random accuracy already happened at the source call site.
    // Reuse native Timed effects/SetStackEffect/HP reconciliation, no reroll.
    if(spell.num==80)
    {
        //5A2180 subtracts3 then clamps the stored DEF to0. Do not leave
        //a hidden negative debt when currentDEF is1/2 and buffs arrive later.
        Bonus acid;
        acid.type=BonusType::PRIMARY_SKILL;
        acid.subtype=BonusSubtypeID(PrimarySkill::DEFENSE);
        acid.val=-std::min<int64_t>(3,target->getDefense(false));
        acid.source=BonusSource::SPELL_EFFECT;
        acid.sid=BonusSourceID(SpellID(80));
        acid.duration=BonusDuration::PERMANENT;
        acid.turnsRemain=3;
        SetStackEffect effect;effect.battleID=battle.getBattle()->getBattleID();
        // Keep signed CC after a saved DEFEND boost is removed. Source
        //446BA0 subtracts4DC without clamp;4422B0 returns that signed DEF.
        Bonus marker=acid;marker.type=BonusType::ERA_SOURCE_ACID_DEFENSE;
        marker.subtype=BonusSubtypeID();marker.val=1;
        marker.valType=BonusValueType::INDEPENDENT_MAX;marker.hidden=true;
        effect.toAdd.emplace_back(target->unitId(),std::vector<Bonus>{acid,marker});
        handler.sendAndApply(effect);
    }
    else
        cast.applyEffects(handler.spellcastEnvironment(),aim,false,true);
    StacksInjured animation;animation.battleID=battle.getBattle()->getBattleID();handler.sendAndApply(animation);
}
inline void applySourceKPoison(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target)
{
    if(!StatusAttacks::get().kPoison(actor) || !actor->alive() || !target || !target->alive())return;
    const int chance=StatusAttacks::get().demilichPoison(actor)
        ?era_bridge::demilichPoisonChance(statusRank(actor)):era_bridge::sourcePoisonChance(statusRank(actor));
    if(chance==0 || !era_bridge::statusRollAccepts(chance,handler.getRandomGenerator().nextInt(1,100)))return;
    if(statusPrimaryAccepts(handler,battle,actor,target,SpellID(71)))applySourceStatus(handler,battle,actor,target,SpellID(71),1);
}
}
