/* Shared source264/265 equipped identity query; no mutation on UI reads. */
#pragma once
#include "EraStatefulArtifactPolicies.h"
#include "../entities/artifact/CArtifact.h"
#include "../entities/artifact/CArtifactInstance.h"
#include "../mapObjects/CGHeroInstance.h"
#include <array>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline std::array<const CArtifactInstance *,2> equippedAtmaArtifacts(const CGHeroInstance & hero)
{
    std::array<const CArtifactInstance *,2> result{};
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero.getArt(ArtifactPosition(slot)))
        {
            const int source=era_compat::StatefulArtifactPolicies::get().sourceIdentity(artifact->getType()->getJsonKey());
            if(source)result[source-264]=artifact;
        }
    return result;
}
inline bool hasEquippedAtma(const CGHeroInstance & hero)
{const auto equipped=equippedAtmaArtifacts(hero);return equipped[0] || equipped[1];}
}
VCMI_LIB_NAMESPACE_END
