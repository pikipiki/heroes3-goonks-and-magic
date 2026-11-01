#pragma once
#include "../../lib/era/EraCDispelSelector.h"
#include "EraStatusAttacks.h"
#include "../../lib/BattleFieldHandler.h"
namespace era_compat_server
{
// Invoke only for explicitly registered source231 c#78. Selection happens before
// the physical hit and its resulting78 marker goes in the SAME target EC queue
// as intrinsic Blind62; a successful later intrinsic proc overwrites this marker.
inline bool selectSourceCDispel(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target)
{
    era_bridge::CDispelSnapshot s;
    s.rank=statusRank(actor);s.actorAlive=actor->alive();s.targetAlive=target && target->alive();
    s.orbOfInhibition=statusEitherArtifact(battle,126);
    s.cursedGround=statusCursedGround(battle);
    if(target)
    {
        s.targetSourceId=StatusAttacks::get().id(target->creatureId().toCreature()->getJsonKey());
        const auto mirror=target->getBonuses(Selector::type()(BonusType::MAGIC_MIRROR)
            .And(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(36)))));
        s.mirrorActive=!mirror->empty();s.mirrorThreshold=mirror->totalValue();
        for(const int spell:era_bridge::sourceCDispelBuffs)
            if(target->hasBonus(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(spell)))))
                s.hasListedBuff=true;
        s.alreadyHasDispelHelpful=target->hasBonus(Selector::source(BonusSource::SPELL_EFFECT,BonusSourceID(SpellID(78))));
        //75CAAF/75C28C: original defender side, not its hypnotized owner.
        const auto * hero=battle.battleGetFightingHero(target->unitSide());
        s.defendingHeroResistance=statusCHeroResistance(hero);
        s.sphereOfPermanence=statusHasArtifact(hero,92);
        s.artifact134=statusHasArtifact(hero,134);
    }
    int rejectionEffect=0;
    const bool selected=era_bridge::selectSourceCDispel(s,[&](int lo,int hi){return handler.getRandomGenerator().nextInt(lo,hi);},&rejectionEffect);
    if(rejectionEffect)emitSourceStatusRejection(handler,battle,target,rejectionEffect);
    return selected;
}
inline bool selectSourceIntrinsicStatus(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * primary,SpellID spell)
{
    if(spell.num!=62 && spell.num!=70)throw std::runtime_error("ERA unproven intrinsic queued spell");
    // Original44032D/440496 draws its20% before life/reception; no breath collateral.
    if(!era_bridge::statusRollAccepts(20,handler.getRandomGenerator().nextInt(1,100)))return false;
    if(!primary || !primary->alive())return false;
    StatusAttackCaster caster(actor,0,battle.battleGetOwner(actor));
    spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell.toSpell());
    cast.setSpellLevel(0);cast.setEffectPower(3);cast.setEffectDuration(3);
    //5A83EF: CursedGround rejects spells of level>1. Orb126 blocks hero
    // casting, not this already-dispatched intrinsic creature accuracy call.
    //44A1EE blocks all creature abilities<=4 with wornDragonFather134,
    // before Orb negation; native normal level immunity alone does not.
    const bool dragonFather=statusHasArtifact(battle.battleGetOwnerHero(primary),134);
    const bool cursed=spell.toSpell()->getLevel()>1 && statusCursedGround(battle);
    const bool receptive=!dragonFather && !cursed && spell.toSpell()->battleMechanics(&cast)->isReceptive(primary);
    const int threshold=receptive?statusRawAccuracy(battle,primary):0;
    return era_bridge::statusRollAccepts(threshold,handler.getRandomGenerator().nextInt(1,100));
}
}
