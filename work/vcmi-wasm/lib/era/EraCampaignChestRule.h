/* Pinned original chest bit fields and experience word arithmetic. */
#pragma once
#include <cstdint>
namespace era_campaign_chest
{
inline int mode(int value){return static_cast<std::uint32_t>(value)&1u;}
inline int artifact(int value){return static_cast<std::uint32_t>(value)&1023u;}
inline int bonus(int value){return static_cast<std::uint32_t>(value)&15u;}
inline int gold(int value){return bonus(value)*500;}
inline int experience(int value){return gold(value)-500;}
inline std::int32_t signedWord(std::uint64_t value)
{
 const auto word=static_cast<std::uint32_t>(value);
 return word<=INT32_MAX?static_cast<std::int32_t>(word):static_cast<std::int32_t>(static_cast<std::int64_t>(word)-INT64_C(4294967296));
}
inline std::uint32_t addExperience(std::uint64_t current,std::int64_t delta)
{return static_cast<std::uint32_t>(current)+static_cast<std::uint32_t>(delta);}
}
