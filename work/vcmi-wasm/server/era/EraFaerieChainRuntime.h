/* Normal source19/5A6670 for explicitly ported Faerie pools, not ChainShot4.
 * GPL-2.0-or-later. */
#pragma once
#include "EraDungeonChainTargets.h"
#include "../../lib/era/EraConfluxCaster.h"
#include "../../lib/era/EraConfluxPolicies.h"
namespace era_compat_server
{
inline bool faerieChainAccuracy(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * target,BattleSide currentSide)
{
    const auto * spell=SpellID(19).toSpell();int accuracy=0;
    if(era_compat::sourceSpellContextAllows(battle,target,spell))
    {
        //5A6500 uses1 for candidate side0,0 for candidate side1. That hero
        //query is independent of CURRENTside read by the Catalyst callback.
        const auto querySide=target->unitSide()==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
        spells::AbilityCaster ability(actor,2);
        era_compat::ConfluxCaster caster(&ability,battle.battleGetFightingHero(currentSide),battle.sideToPlayer(currentSide));
        spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,spell);
        auto mechanics=spell->battleMechanics(&cast);mechanics->casterSide=querySide;
        const auto * factory=spells::TargetConditionItemFactory::getDefault();
        spells::TargetCondition condition;
        condition.absolute={factory->createAbsoluteSpell(),factory->createAbsoluteLevel()};
        condition.normal={factory->createElemental(),factory->createNormalLevel(),factory->createNormalSpell()};
        condition.negation={factory->createReceptiveFeature(),factory->createImmunityNegation()};
        era_compat::ConfluxResistanceScope heroQuery(true,querySide);
        if(const auto rod=era_compat::sourceLightningResistance(battle,19,currentSide,*target))accuracy=100-*rod;
        else if(condition.isReceptive(mechanics.get(),target))accuracy=era_compat::statusRawAccuracy(battle,target,true,querySide);
    }
    return handler.getRandomGenerator().nextInt(1,100)<=accuracy;
}
inline bool applyFaerieNormalChain(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * actor,const CStack * primary,spells::BattleCast & original,BattleSide side)
{
    if(!primary || !primary->alive())return false;
    const auto * spell=SpellID(19).toSpell();
    auto initial=spell->battleMechanics(&original);
    int64_t raw=initial->getEffectValue();
    const int hops=initial->getEffectLevel()>=2?5:4; //Original642284={4,4,5,5}.
    const CStack * current=primary;uint32_t previous=actor->unitId();
    std::vector<uint32_t> visited;
    for(int hop=0;hop<hops&&current;++hop)
    {
        const auto position=dungeonSourceCandidate(current);
        BattleSpellCast animation;animation.battleID=battle.getBattle()->getBattleID();
        animation.side=side;animation.spellID=SpellID(19);animation.tile=current->getPosition();
        animation.casterStack=previous;animation.castByHero=false;animation.activeCast=hop==0;
        animation.affectedCres.insert(current->unitId());handler.sendAndApply(animation);
        auto cast=original;cast.setEffectValue(raw);
        spells::Target target;target.emplace_back(current);
        //Already accepted target; bypass native chain transform and immunity
        //rerolls, retaining normal source19 magic protection/hero corrections.
        cast.applyEffects(handler.spellcastEnvironment(),target,false,true);
        visited.push_back(current->unitId());previous=current->unitId();
        auto candidates=dungeonSourceCandidates(battle);
        candidates.erase(std::remove_if(candidates.begin(),candidates.end(),[&](const auto & candidate)
            {return battle.battleGetStackByID(candidate.id,false)->sourceMassSlot()<0;}),candidates.end());
        //Original candidate loop also rolls dead/removed records before distance.
        //Retain native records with invalid position for their mandatory zero draw.
        for(const auto * unit:battle.battleGetAllStacks(false))
            if(unit->sourceMassSlot()>=0 && !unit->getPosition().isValid())
                candidates.push_back({unit->unitId(),unit->unitSide()==BattleSide::DEFENDER?1:0,0,0});
        std::stable_sort(candidates.begin(),candidates.end(),[&](const auto & a,const auto & b)
        {
            const auto * lhs=battle.battleGetStackByID(a.id,false),*rhs=battle.battleGetStackByID(b.id,false);
            return std::make_pair(a.originalSide,lhs->sourceMassSlot())<std::make_pair(b.originalSide,rhs->sourceMassSlot());
        });
        const auto * next=::era_bridge::dungeonChainNext(position,candidates,visited,[&](const auto & candidate)
        {return faerieChainAccuracy(handler,battle,actor,battle.battleGetStackByID(candidate.id,false),side);});
        current=next?battle.battleGetStackByID(next->id,false):nullptr;
        raw/=2; //Normal19 halves toward zero, unlike Shot4's signed SAR.
        //Selection/RNG runs after hit5 too, before the source loop limit test.
    }
    actor->spendMana(handler.spellcastEnvironment(),1);
    return true;
}
}
