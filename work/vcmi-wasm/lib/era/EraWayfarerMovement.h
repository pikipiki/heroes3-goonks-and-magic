#pragma once
#include <cstdint>
#include <limits>
namespace era_bridge
{
inline int32_t sourceWayfarerDailyRemaining(int32_t current)
{
    const uint32_t bits=uint32_t(current)+uint32_t(400);
    if(bits<=uint32_t(std::numeric_limits<int32_t>::max()))return int32_t(bits);
    return -1-int32_t(std::numeric_limits<uint32_t>::max()-bits);
}
}
