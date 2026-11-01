/* Signed IDIV damage semantics from original443DB0; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <limits>
#include <stdexcept>
namespace era_bridge
{
struct SignedDamageHealth { int32_t count; int32_t firstHPleft; };
inline SignedDamageHealth negativeSpellDamage(int32_t count, int32_t unitHealth,
    int32_t firstHPleft, int64_t damage)
{
    if(count <= 0 || unitHealth <= 0 || firstHPleft <= 0 || damage >= 0
        || damage < std::numeric_limits<int32_t>::min())
        throw std::runtime_error("ERA signed spell damage outside original signed32 bounds");
    const int64_t lost = static_cast<int64_t>(unitHealth) - firstHPleft;
    const int64_t totalLost = lost + damage;
    if(totalLost < std::numeric_limits<int32_t>::min() || totalLost > std::numeric_limits<int32_t>::max())
        throw std::runtime_error("ERA signed spell damage lostHP overflow");
    const int64_t killed = totalLost / unitHealth; // signed IDIV truncates toward0
    const int64_t nextCount = count - killed;
    const int64_t nextFirst = unitHealth - totalLost % unitHealth;
    if(nextCount <= 0 || nextCount > std::numeric_limits<int32_t>::max()
        || nextFirst <= 0 || nextFirst > std::numeric_limits<int32_t>::max())
        throw std::runtime_error("ERA signed spell damage count/HP overflow");
    return {static_cast<int32_t>(nextCount), static_cast<int32_t>(nextFirst)};
}
}
