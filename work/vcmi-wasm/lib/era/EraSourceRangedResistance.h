/* Shipped Amethyst1001B75D..1001B820: float32 table addition, double
 * multiplication and truncation before source71C710. GPL-2.0-or-later. */
#pragma once
#include <cstdint>
namespace era_bridge
{
inline int64_t sourceRangedResistance30(int64_t damage)
{
    if(damage<=0)return damage;
    const float resistance=0.3f;
    return static_cast<int64_t>(static_cast<double>(damage)*(1.0-static_cast<double>(resistance)));
}
}
