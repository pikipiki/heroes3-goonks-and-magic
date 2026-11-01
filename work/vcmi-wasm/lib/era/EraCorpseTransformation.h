/* Independent ERA corpse conversion arithmetic; GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <limits>
namespace era_bridge
{
inline int32_t raisedCorpseCount(int64_t castBudget, int64_t corpseTotalHealth,
                                int64_t corpseInitialCount, int64_t targetHealth)
{
    if(castBudget <= 0 || corpseTotalHealth <= 0 || corpseInitialCount <= 0 || targetHealth <= 0)
        return 0;
    const int64_t count = std::min(corpseInitialCount, std::min(castBudget, corpseTotalHealth) / targetHealth);
    return static_cast<int32_t>(std::min<int64_t>(count, std::numeric_limits<int32_t>::max()));
}
}
