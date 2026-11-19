/* Source77 rule125 and HE:C1/source/target/d/d/1; GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <array>
#include <cstdint>
#include "EraSourceStackExperienceRules.h"
#include <optional>
#include <utility>

namespace era_bridge::map_rules
{
inline constexpr std::array<std::pair<int,int>,9> eighthUpgradePairs{{
    {13,150},{27,151},{41,152},{55,153},{69,154},
    {83,155},{97,156},{111,157},{131,158}
}};
inline std::optional<int> eighthUpgradeTarget(int source)
{
    for(const auto & pair:eighthUpgradePairs)
        if(pair.first==source)return pair.second;
    return std::nullopt;
}
inline bool eighthUpgradeHasQuantity(const std::array<int32_t,7> & matchingCounts)
{
    // The original army precheck sums all matching slots as a 32-bit word.
    uint32_t total=0;
    for(const auto count:matchingCounts)total+=static_cast<uint32_t>(count);
    return total!=0;
}
inline int32_t eighthUpgradeExperience(int32_t oldExperience,int32_t count,
    int32_t oldMaximum,int32_t newMaximum)
{
    return stack_experience::transform(oldExperience,count,oldMaximum,newMaximum);
}
}
