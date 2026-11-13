/* Emerald damage endpoints retain their order. Original442F58/50C7C0. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <utility>
namespace era_bridge
{
// Only called for an inverted range owned by a verified Emerald artifact.
// Original442F64 tests Bless before Curse.50C7CF returns LOW when HIGH<LOW,
// without drawing random numbers. Return a constant ordered range to the native
// damage sampler; do not exchange endpoints before choosing Bless/Curse.
inline std::pair<int64_t,int64_t> sourceEmeraldInvertedDamage(int64_t low,int64_t high,
    bool blessed,int blessAdd,bool cursed,int curseSubtract)
{
    const auto value=blessed ? high+blessAdd : cursed ? low-curseSubtract : low;
    const auto clamped=std::max<int64_t>(1,value);
    return {clamped,clamped};
}
}
