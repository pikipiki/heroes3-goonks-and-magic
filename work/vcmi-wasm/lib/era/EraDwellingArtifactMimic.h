/* Query-only source creature artifacts90/123, not copies of artifact bonuses. */
#pragma once
#include "EraCreatureArtifactMimic.h"
#include "EraDwellingServices.h"
#include "../mapObjects/CGHeroInstance.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat {
inline bool dwellingWaterWalking(const CGHeroInstance & hero)
{
    return DwellingServices::get().enabled(311) && originalArmyMimicsArtifact(hero,90);
}
inline bool dwellingWhirlpoolProtection(const CGHeroInstance & hero)
{
    return DwellingServices::get().enabled(288) && originalArmyMimicsArtifact(hero,123);
}
inline bool dwellingArtifactSpell(const CGHeroInstance & hero,int spell)
{
    // Original123 ArtGiveSpell bitset: Summon Boat0 and Scuttle Boat1.
    // MonGiveSpell changes availability only, not the learned spell set or mastery.
    return (spell==0 || spell==1) && hero.hasSpellbook() && dwellingWhirlpoolProtection(hero);
}
}
VCMI_LIB_NAMESPACE_END
