#pragma once
#include <algorithm>
#include <cstdint>
namespace era_bridge
{
// Shipped Objects_CreatureBanksExtender.dll302025e0... at10008437..10008474:
// add clamp(0, award, maxSpellPoints-current) only when current<maxSpellPoints.
// Source parser clips award to0..999. Never reduce a balance already above cap.
inline int32_t calculateBankMana(int32_t current, int32_t award, int32_t cap)
{
 if (current < 0 || current >= cap || award <= 0)
  return current;
 const int64_t missing = static_cast<int64_t>(cap) - current;
 return static_cast<int32_t>(static_cast<int64_t>(current) + std::min<int64_t>(award, missing));
}
}
