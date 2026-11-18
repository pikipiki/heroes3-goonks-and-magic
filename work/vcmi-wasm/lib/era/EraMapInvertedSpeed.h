/* WoG112 raw MA:S arithmetic, before the source setter's lower clamp. */
#pragma once
#include <cstdint>
namespace era_bridge::map_rules
{
inline constexpr std::int32_t invertedSpeed(std::int32_t maximum,std::int32_t old)
{
 const auto bits=std::uint32_t(maximum)-std::uint32_t(old)+3u;
 const auto signedValue=bits<=0x7fffffffu?std::int64_t(bits):std::int64_t(bits)-0x100000000ll;
 return signedValue<1?1:static_cast<std::int32_t>(signedValue);
}
}
