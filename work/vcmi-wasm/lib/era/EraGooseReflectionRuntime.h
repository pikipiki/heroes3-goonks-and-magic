/* TUM179 income and181 post-aura resistance; GPL-2.0-or-later. */
#pragma once
#include "EraGooseReflection.h"
#include "EraBridgeArtifactPolicies.h"
#include "../entities/artifact/CArtifact.h"
#include "../entities/artifact/CArtifactInstance.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../ResourceSet.h"
#include <limits>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct GooseIncomeAdjustment { int64_t nativeComponentGold=0;int64_t sourceRawGold=0; };
inline GooseIncomeAdjustment sourceGooseIncome(const CGHeroInstance & hero)
{
    GooseIncomeAdjustment result;
    const GameResID gold(GameResID::GOLD);
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero.getArt(ArtifactPosition(slot)))
            if(const auto policy=ArtifactPolicies::get().goldenGoose(artifact->getType()->getJsonKey()))
            {
                // Native combination artifacts inherit their component income.
                // Source179 does not, and instead pays raw7000 via OW:R. Derive
                // the actual inherited native gold to avoid a2250 assumption.
                result.nativeComponentGold+=artifact->valOfBonuses(BonusType::GENERATE_RESOURCE,BonusSubtypeID(gold));
                result.sourceRawGold+=::era_bridge::goldenGooseRawIncome(1,1,*policy);
            }
    for(size_t index=0;index<hero.artifactsInBackpack.size();++index)
        if(const auto * artifact=hero.getArt(ArtifactPosition(static_cast<int>(ArtifactPosition::BACKPACK_START)+static_cast<int>(index))))
            if(const auto policy=ArtifactPolicies::get().goldenGoose(artifact->getType()->getJsonKey());policy && *policy)
                result.sourceRawGold+=::era_bridge::goldenGooseRawIncome(1,0,true);
    return result;
}
inline TResource sourceGooseGoldValue(int64_t value)
{
    return static_cast<TResource>(std::clamp(value,static_cast<int64_t>(std::numeric_limits<TResource>::min()),
        static_cast<int64_t>(std::numeric_limits<TResource>::max())));
}
inline bool sourceReflectionEquipped(const CGHeroInstance & hero)
{
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero.getArt(ArtifactPosition(slot)))
            if(ArtifactPolicies::get().reflection(artifact->getType()->getJsonKey()))return true;
    return false;
}
}
VCMI_LIB_NAMESPACE_END
