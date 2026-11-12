/* Full physical block before partial deflection, source766AA2; GPL-2.0-or-later. */
#pragma once
#include "EraCrystalExperience.h"
#include "EraBridgePolicies.h"
#include "../CStack.h"
#include "../mapObjects/army/CStackInstance.h"
#include <vstd/RNG.h>
VCMI_LIB_NAMESPACE_BEGIN
inline bool applyEraCrystalPhysicalBlock(const CStack * original, vstd::RNG & rng)
{
    if(!original) return false;
    const auto policy=era_compat::Policies::get().physicalBlock(original->creatureId().toCreature()->getJsonKey());
    if(!policy) return false;
    const int rank=original->base?std::min<int>(10,original->base->getExpRank()):0;
    const int chance=policy->at(rank);
    return chance>0 && ::era_bridge::sourcePhysicalBlock(chance,rng.nextInt(1,100));
}
VCMI_LIB_NAMESPACE_END
