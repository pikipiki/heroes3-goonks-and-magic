/* WoG71E8B5..71E90E source g% arithmetic. GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <limits>
namespace era_bridge
{
constexpr int32_t sourceMagicReductionMarker=0x45524731; // ERG1
inline int64_t sourceExperienceMagicReduction(int64_t raw,int percentage)
{
    // The original argument is a nonnegative signed Win32 integer. Its F32
    // store is observable before MSVC ftol2. Keep that narrowing and truncation.
    // Additional-mod values outside that domain saturate instead of overflowing
    // a Win32 conversion (e.g. g0 rounding INT_MAX upward to 2147483648).
    const auto bounded=std::clamp<int64_t>(raw,0,std::numeric_limits<int32_t>::max());
    const double fraction=1.0-static_cast<double>(std::clamp(percentage,0,255))/100.0;
    float stored=static_cast<float>(static_cast<double>(bounded)*fraction);
    // Preserve the original F32 clamp itself: writing ORIGINALRAW back to a
    // float can round upward again (16777219,g0 =>16777220). This is defined
    // behavior, not a reason to silently replace it with integer arithmetic.
    if(static_cast<double>(stored)>static_cast<double>(bounded))stored=static_cast<float>(bounded);
    if(stored<0)stored=0;
    return static_cast<int64_t>(std::min<double>(stored,std::numeric_limits<int32_t>::max()));
}
}
