/* Amethyst ReduceTargetDefense2 source4422E3; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
namespace era_bridge
{
inline int defenseAfterReduction95(int defense)
{
    // Source stores both ratio and input defense as IEEE binary32, then uses
    // x87 multiplication/subtraction and truncates toward zero at617F94.
    // Product of two binary32 operands fits exactly in binary64 (<=48bits).
    const float ratio = static_cast<float>(95.0 / 100.0);
    const double sourceDefense = static_cast<float>(defense);
    return static_cast<int>(sourceDefense - sourceDefense * static_cast<double>(ratio));
}
// WoG XP b,71E621..635. Integral byte percentages make this exact rational
// expression equivalent to x87 then truncation for the full signed int domain.
inline int defenseAfterExperienceReduction(int defense,int percent)
{
    const int bounded = percent < 0 ? 0 : percent > 100 ? 100 : percent;
    return static_cast<int>(static_cast<std::int64_t>(defense) * (100-bounded) / 100);
}

}
