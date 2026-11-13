/* Source346 intrinsic fire shield: 442E50/Amethyst442E61 and422619.
 * GPL-2.0-or-later. Calculation primitive only; no runtime admission here. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <optional>

namespace era_bridge
{
inline float primordialShieldCoefficient(std::optional<float> activeSpell29)
{
    // A live spell overrides the intrinsic0.3, including a weaker20% spell.
    // Caller supplies the finite source spell coefficient, not a bonus sum.
    return activeSpell29.value_or(0.3f);
}

inline std::int32_t primordialShieldRaw(std::int32_t availableHealth,
    std::int32_t physicalInput, std::optional<float> activeSpell29)
{
    // FILD(min signedDWORD), FSTP REAL4, FMUL coefficient, then ftol.
    // Multiplication of two float significands is exact in double (48bits).
    // Keep the result wider until truncation: another REAL4 rounding would
    // differ from the original x87 path at large but defined damage values.
    const float raw = static_cast<float>(std::min(availableHealth, physicalInput));
    return static_cast<std::int32_t>(static_cast<double>(raw)
        * static_cast<double>(primordialShieldCoefficient(activeSpell29)));
}
}
