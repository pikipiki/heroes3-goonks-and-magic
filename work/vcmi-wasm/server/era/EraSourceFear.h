/* Scoped ERA fear service. Native fallback owns all unmarked/modified auras. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/mapObjects/army/CCreatureSet.h"
#include <algorithm>
#include "../../lib/era/EraSourceFearSemantics.h"
#include "../../lib/era/EraSourceFearPolicies.h"
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/bonuses/BonusList.h"
#include "../../lib/bonuses/Propagators.h"
#include <optional>
namespace era_server
{
inline bool canonicalSourceFearBonus(const Bonus & b)
{
    return b.type == BonusType::FEARFUL && b.val == 10
        && b.valType == BonusValueType::INDEPENDENT_MAX
        && (b.source == BonusSource::CREATURE_ABILITY || b.source == BonusSource::STACK_EXPERIENCE)
        && b.propagator && b.propagator->getPropagatorType() == BonusNodeType::BATTLE_WIDE
        && era_compat::SourceFearPolicies::get().canonical(b.stacking);
}
// nullopt means the caller must run precisely its original VCMI fear branch.
inline std::optional<bool> trySourceFear(CGameHandler & handler,
    const CBattleInfoCallback & battle, const CStack * target)
{
    const auto & policies = era_compat::SourceFearPolicies::get();
    if(policies.empty())
        return std::nullopt;
    if(policies.fallbackTarget(target->unitType()->getJsonKey()))
        return std::nullopt; // e.g.194 biology is deliberately not changed here.
    bool zeroMinimum = false, foreignFear = false, sourceEffect = false;
    const auto effectiveFear = target->getBonuses(Selector::type()(BonusType::FEARFUL));
    for(const auto & b : *effectiveFear)
    {
        if(canonicalSourceFearBonus(*b))
            sourceEffect = true;
        if(b->val == 0 && b->valType == BonusValueType::INDEPENDENT_MIN)
            zeroMinimum = true;
        else if(!canonicalSourceFearBonus(*b) && (b->val != 0 || b->valType == BonusValueType::INDEPENDENT_MIN))
            foreignFear = true;
    }
    std::vector<era_bridge::SourceFearProducer> producers;
    for(const auto * emitter : battle.battleGetAllStacks())
    {
        const auto * policy = policies.find(emitter->unitType()->getJsonKey());
        if(!policy)
            continue;
        bool marked = false;
        // Read the original exported aura: OPPOSITE_SIDE intentionally removes
        // an aura from its emitter's effective bonus list. Rank is checked below.
        for(const auto & b : emitter->unitType()->getExportedBonusList())
            if(canonicalSourceFearBonus(*b) && b->stacking == policy->marker)
                marked = true;
        const int rank = emitter->base ? std::clamp(emitter->base->getExpRank(),0,10) : 0;
        producers.push_back({true,emitter->alive() && emitter->getCount() > 0,
            emitter->unitSide() == BattleSide::ATTACKER ? 0 : 1,marked,rank,policy->firstRank});
    }
    const bool noMoraleEquivalent = target->hasBonusOfType(BonusType::NO_MORALE)
        || target->hasBonusOfType(BonusType::UNDEAD)
        || target->hasBonusOfType(BonusType::NON_LIVING)
        || target->hasBonusOfType(BonusType::MECHANICAL)
        || target->hasBonusOfType(BonusType::SIEGE_WEAPON);
    const auto route = era_bridge::planSourceFear({target->alive(),
        target->unitSide() == BattleSide::ATTACKER ? 0 : 1,target->isHypnotized(),
        noMoraleEquivalent,zeroMinimum},producers,foreignFear,sourceEffect);
    if(route == era_bridge::SourceFearRoute::NativeFallback)
        return std::nullopt;
    // Distribution and gate timing match the CRT return-value law. This uses
    // VCMI's serialized game RNG, not the original global Windows CRT sequence.
    return era_bridge::executeSourceFear(route,[&](){return handler.getRandomGenerator().nextInt(0,32767);});
}
}
