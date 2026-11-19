/* ERA regular income rounding; GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>

namespace era_bridge
{
// Original FISTP helper truncates toward zero. Income and percent are signed
// 32-bit values; their product fits int64_t, including INT32_MIN squared.
inline int64_t regularIncomeAfterHandicap(int32_t income, int32_t percent, int64_t cap)
{
    return std::min(cap, static_cast<int64_t>(income) * percent / 100);
}
}
