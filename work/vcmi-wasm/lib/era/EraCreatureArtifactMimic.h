/* Source-scoped native adapter for CreatureMimicArtifact queries129/135/71; GPL-2.0-or-later. */
#pragma once
#include "EraCreatureArtifactRuntime.h"
#include "EraBridgePolicies.h"
#include "../CCreatureHandler.h"
#include "../mapObjects/army/CArmedInstance.h"
#include "../mapObjects/army/CStackInstance.h"

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct AngelicArmyMorale
{
    int value = 0;
    CreatureID source = CreatureID::NONE;
};
inline AngelicArmyMorale originalArmyAngelicMorale(const CArmedInstance & army)
{
    const auto & policies = Policies::get().angelicArmyMorale();
    if(policies.empty())
        return {};
    std::vector<::era_bridge::OriginalArmyMoraleMember> slots;
    CreatureID cherub = CreatureID::NONE, supreme = CreatureID::NONE;
    for(const auto & entry : army.Slots())
    {
        const auto * stack = entry.second.get();
        const auto creature = stack->getCreatureID();
        if(!creature.hasValue() || stack->getCount() <= 0)
            continue;
        const auto key = creature.toCreature()->getJsonKey();
        bool isCherub = policies.count(key) != 0, isSupreme = false;
        for(const auto & policy : policies)
            isSupreme = isSupreme || policy.second == key;
        if(stack->getCount() > 0 && isCherub)
            cherub = creature;
        if(stack->getCount() > 0 && isSupreme)
            supreme = creature;
        slots.push_back({stack->getCount(), isCherub, isSupreme});
    }
    return {::era_bridge::sourceAngelicArmyMorale(slots), cherub.hasValue() ? cherub : supreme};
}
inline bool originalArmyMimicsArtifact(const CArmedInstance & army, int artifact)
{
    if(army.getNodeType() != BonusNodeType::HERO)
        return false;
    // Map army only. CStack::localInit also attaches summoned battle units to
    // the hero; using propagated creature bonuses would therefore be too broad.
    std::vector<::era_bridge::OriginalArmyArtifactMimic> slots;
    for(const auto & entry : army.Slots())
    {
        const auto * stack = entry.second.get();
        if(!stack->getCreatureID().hasValue() || stack->getCount() <= 0)
            continue;
        const auto mimic = Policies::get().artifactMimic(stack->getCreatureID().toCreature()->getJsonKey());
        slots.push_back({stack->getCount(), mimic.value_or(0)});
    }
    return ::era_bridge::originalArmyHasMimic(true, slots, artifact);
}
}
VCMI_LIB_NAMESPACE_END
