/* Shared source71C710 adapter, only invoke at proven replacement call sites. */
#pragma once
#include "EraPhysicalDeflection.h"
#include "EraBridgePolicies.h"
#include "../CStack.h"
#include "../mapObjects/army/CStackInstance.h"
#include <vstd/RNG.h>
#include <functional>
VCMI_LIB_NAMESPACE_BEGIN
inline int64_t applyEraDeflection(const CStack * original, vstd::RNG & rng, int64_t damage,
    const std::function<void(int,int)> & notify = {})
{
    if(!original) return damage;
    const auto policy = era_compat::Policies::get().physicalDeflection(original->creatureId().toCreature()->getJsonKey());
    if(!policy) return damage;
    const auto rank = original->base ? std::min<int>(10, original->base->getExpRank()) : 0;
    const auto rule = era_bridge::PhysicalDeflection::decode(policy->modifier, policy->values.at(rank));
    return rule.needsRoll() ? rule.apply(damage, rule.succeeds(rng.nextInt(1, 100)),[&](int strength,int chance){if(notify)notify(strength,chance);}) : damage;
}
VCMI_LIB_NAMESPACE_END
