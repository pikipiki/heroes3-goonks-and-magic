/* Original718DA9 distribution mode0, source-default; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <vector>
namespace era_bridge
{
inline std::vector<uint64_t> distributeExperienceModeZero(int64_t experience,
    const std::vector<float> & multipliers)
{
    // Only the source half/integer weights and signed32 awards are admitted.
    // Their sum is exact in float32 for the original maximum7 army slots.
    if(experience < 0 || experience > std::numeric_limits<int32_t>::max() || multipliers.size() > 7)
        throw std::runtime_error("ERA experience distribution outside source bounds");
    float total = 0;
    for(float weight : multipliers)
    {
        if(weight != 0.5f && weight != 1.0f)
            throw std::runtime_error("ERA experience distribution requires verified half/integer weights");
        total = static_cast<float>(total + weight);
    }
    std::vector<uint64_t> awards;
    for(float weight : multipliers)
    {
        //719161..71918F: XP*100*weight/sum/100 + sourcefloat1e-4,
        // then truncation; no count division for defaultmode0.
        const double award = static_cast<double>(experience) * weight / total + static_cast<double>(0.0001f);
        awards.push_back(static_cast<uint64_t>(award));
    }
    return awards;
}
}
