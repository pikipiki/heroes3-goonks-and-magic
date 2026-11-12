/* Original5A86C6 IMUL32, followed by signed CMP/JLE at5A86CA..CC. */
#pragma once
#include <cstdint>
#include <limits>
namespace era_bridge
{
inline int32_t sourceHypnotizeHealth(int64_t count,int64_t perCreatureHealth)
{
    const uint32_t product=uint32_t(count)*uint32_t(perCreatureHealth);
    if(product<=uint32_t(std::numeric_limits<int32_t>::max()))return int32_t(product);
    // Decode the signed DWORD without implementation-defined narrowing or UB.
    return -1-int32_t(std::numeric_limits<uint32_t>::max()-product);
}
}
