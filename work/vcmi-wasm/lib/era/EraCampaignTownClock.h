/* Original per-player signed-byte OW:D countdown. GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <optional>
#include <stdexcept>
namespace era_campaign_town_clock
{
inline int byte(std::int32_t value){return static_cast<std::uint32_t>(value)&255u;}
inline void validate(int value){if(value<0||value>255)throw std::runtime_error("Invalid source town countdown byte");}
inline bool immortal(int value){validate(value);return value>=128&&value<=254;}
inline int tick(int value){validate(value);return value>0&&value<128?value-1:value;}
inline std::optional<int> warningDays(int value)
{validate(value);if(immortal(value))return std::nullopt;return value==255?7:value;}
inline std::optional<std::uint8_t> shadow(int value)
{
 const auto days=warningDays(value);if(!days)return std::nullopt;
 return static_cast<std::uint8_t>(*days>=7?0:7-*days);
}
}
