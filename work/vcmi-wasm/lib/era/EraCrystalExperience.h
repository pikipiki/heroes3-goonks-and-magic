/* Source71EAA6 regeneration and71C5A9 full physical block; GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>
namespace era_bridge
{
// Original r uses an unsigned rank byte and a signed modifier chance. These
// reviewed actors use #100. The caller consumes the original1..100 RNG draw,
// including at rank0 and when no HP are missing. It never resurrects units.
inline int sourceExperienceRegeneration(int points, int missingHealth, int chance, int roll1to100)
{
    return roll1to100 >= 1 && roll1to100 <= std::clamp(chance, 0, 100)
        ? std::min(std::max(0, points), std::max(0, missingHealth)) : 0;
}
// Source B= round(x+0.5) gives the integral original row unchanged. This is a
// full block, distinct from L's partial damage reduction. No roll at chance0.
inline bool sourcePhysicalBlock(int chance, int roll1to100)
{
    return chance > 0 && roll1to100 >= 1 && roll1to100 <= std::min(100, chance);
}
}
