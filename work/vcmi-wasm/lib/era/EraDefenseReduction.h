/* Amethyst ReduceTargetDefense2 source4422E3; GPL-2.0-or-later. */
#pragma once
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
}
