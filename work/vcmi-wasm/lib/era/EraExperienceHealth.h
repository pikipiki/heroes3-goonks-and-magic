#pragma once
#include <cmath>
#include <cstdint>
#include <limits>
#include <stdexcept>

namespace era_bridge
{
// h3era71B9A9 first stores original6C as binary32. ApplyMod71C10C
// evaluates percent*base/100 +0.5 +base, stores binary32, then caller
//71BA32 truncates it. The caller must supply health before this XP row.
inline int32_t sourceExperienceHealth(int32_t beforeExperience, int32_t percent)
{
    if(percent < 0 || percent > 255)
        throw std::invalid_argument("ERA health XP percentage outside source byte domain");
    const float sourceBase = static_cast<float>(beforeExperience);
    const double addition = static_cast<double>(percent) * sourceBase / 100.0 + 0.5;
    const float result = static_cast<float>(addition + sourceBase);
    if(!std::isfinite(result) || static_cast<double>(result) < std::numeric_limits<int32_t>::min()
        || static_cast<double>(result) >= 2147483648.0)
        throw std::overflow_error("ERA health XP exceeds signed source HP domain");
    return static_cast<int32_t>(result);
}
}
