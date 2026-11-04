#pragma once

// Amethyst10015DCA adds this creature-pair constant to the physical extra-damage
// accumulator. It is independent of the stack count and is reduced by the
// subsequent physical protections. CREXPBON h remains a separate percentage.
namespace EraBridge
{
inline double personalHateBeforeDefense(double baseDamage, double attackFactor, int flatDamage)
{
    return baseDamage * attackFactor + flatDamage;
}
}
