/* WoG197 patches the original145-bit check without moving its five words.
 * Native reads160..196 address the following artifact bitmap at0x90. */
#pragma once
#include <optional>
namespace era_campaign_creature_carry
{
inline constexpr std::optional<int> artifactMaskIndex(int source)
{
 constexpr int first=(0x90-0x7c)*8;
 return source>=first&&source<197?std::optional<int>(source-first):std::nullopt;
}
}
