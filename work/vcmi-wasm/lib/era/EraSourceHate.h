/* Conditional source identities, never placeholder creatures. GPL-2.0-or-later. */
#pragma once
namespace era_bridge
{
inline constexpr bool sourceStrongholdHatePair(int attacker,int target)
{
    return (attacker==275 || attacker==283) && (target==274 || target==282);
}
}
