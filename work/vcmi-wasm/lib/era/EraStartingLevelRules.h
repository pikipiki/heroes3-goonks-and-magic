/* Source77 rule118 and original HE:E / CO:X1 experience words.
 * GPL-2.0-or-later. These calculations do not award secondary skills. */
#pragma once
#include <cstdint>
#include <optional>
namespace era_bridge::starting_level
{
inline int32_t signedWord(uint32_t value)
{
    return value <= UINT32_C(0x7fffffff) ? static_cast<int32_t>(value)
        : -1-static_cast<int32_t>(UINT32_MAX-value);
}
inline int32_t add(int32_t left,int32_t right)
{return signedWord(static_cast<uint32_t>(left)+static_cast<uint32_t>(right));}
// HE:E uses a signed comparison and a relative wrapped delta. In particular,
// a negative stored word is brought to exactly5000, not saturated or capped.
inline std::optional<int32_t> heroDelta(int32_t experience)
{
    if(experience>=5000)return std::nullopt;
    return signedWord(UINT32_C(5000)-static_cast<uint32_t>(experience));
}
// The native original gain hook reads its own last-hero-XP reference. It may
// differ from the hero's XP immediately before HE:E; do not substitute that XP.
inline int32_t commanderDelta(int32_t heroExperience,int32_t reference,bool paladin)
{
    auto result=signedWord(static_cast<uint32_t>(heroExperience)-static_cast<uint32_t>(reference));
    if(paladin)result=signedWord(static_cast<uint32_t>(result)*UINT32_C(150))/100;
    return result;
}
// CO2's rule118 bonus is already multiplied for Paladins. CO:X1 adds the raw
// word and does not perform another multiplication or a rank-up.
inline constexpr int32_t purchaseBonus(bool paladin){return paladin?7500:5000;}
}
