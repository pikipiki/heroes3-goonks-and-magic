#pragma once
#include <cstdint>

namespace era_bridge::creature_levels
{
// MA:L applies a signed clamp after the ordinary int32 PutVal operation.
// Reads do not pass through this clamp.
inline constexpr std::int32_t writeLevel(std::int32_t value)
{return value<-1?-1:value>6?6:value;}
}
