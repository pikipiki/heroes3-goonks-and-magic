#pragma once
#include <cstdint>
#include <vector>
namespace era_bridge
{
struct OriginalArmyMoraleMember
{
    std::int64_t count;
    bool cherub;
    bool supremeArchangel;
};
inline int sourceAngelicArmyMorale(const std::vector<OriginalArmyMoraleMember> & originalArmy)
{
    bool cherub = false, supreme = false;
    for(const auto & stack : originalArmy)
        if(stack.count > 0)
        {
            cherub = cherub || stack.cherub;
            supreme = supreme || stack.supremeArchangel;
        }
    return cherub || supreme ? 2 - (supreme ? 1 : 0) : 0;
}
struct OriginalArmyArtifactMimic
{
    std::int64_t count;
    int artifact;
};
// Emerald duplicate.cpp:533-539 scans only original hero army slots with Cn>0.
// New battle summons/clone stacks are intentionally absent from this input.
inline bool originalArmyHasMimic(bool hasHero,
    const std::vector<OriginalArmyArtifactMimic> & originalArmy, int artifact)
{
    if(!hasHero)
        return false;
    for(const auto & stack : originalArmy)
        if(stack.count > 0 && stack.artifact == artifact)
            return true;
    return false;
}
inline bool needsMimicOpeningSpell(bool hasHero, bool originalArmyMimics,
    bool actualArtifactEquipped)
{
    return hasHero && originalArmyMimics && !actualArtifactEquipped;
}
}
