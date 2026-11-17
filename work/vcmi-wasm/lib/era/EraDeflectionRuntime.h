/* Shared source71C710 adapter, only invoke at proven replacement call sites. */
#pragma once
#include "EraPhysicalDeflection.h"
#include "EraBridgePolicies.h"
#include "EraHenchmanBattleBanner.h"
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
    const bool banner=era_compat::henchmen::battleBanner(*original)
        ==era_bridge::henchmen::BannerStyle::PARTIAL_BLOCK;
    if(!policy&&!banner) return damage;
    const auto rank = original->base ? std::min<int>(10, original->base->getExpRank()) : 0;
    auto rule = policy?era_bridge::PhysicalDeflection::decode(policy->modifier, policy->values.at(rank))
        :era_bridge::PhysicalDeflection{0,0};
    bool success=rule.needsRoll()&&rule.succeeds(rng.nextInt(1,100));
    // Source71C710 rolls row L before the independent banner roll, including
    // when a successful row already blocks more than the banner's 50%.
    if(banner&&rng.nextInt(1,100)<=25)
    {
        rule.strength=success?std::max(rule.strength,50):50;
        rule.chance=std::max(rule.chance,25);success=true;
    }
    return rule.apply(damage,success,[&](int strength,int chance){if(notify)notify(strength,chance);});
}
VCMI_LIB_NAMESPACE_END
