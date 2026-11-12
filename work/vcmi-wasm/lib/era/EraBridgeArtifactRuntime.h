#pragma once
#include <array>
#include <cstddef>
#include <vector>
#include <cstdint>
#include <limits>
#include <stdexcept>
// Independent semantics of Emerald events.cpp:303-308.
namespace era_bridge
{
struct OpeningSummon { int creature; int encodedPower; };
// Emerald CastArtifactSummon: signed integer scaling, truncation towards zero,
// fallback to the hero's power, then a minimum of one when the result is zero.
// Original SummonCreature(2, creature, power, 0) uses Visions' base effect1.
inline int artifactSummonCount(int encodedPower, int heroPower)
{
    const std::int64_t amount=encodedPower<0
        ? -static_cast<std::int64_t>(encodedPower)*heroPower/1000
        : encodedPower==0 ? heroPower : encodedPower;
    if(amount<0 || amount>std::numeric_limits<int>::max())
        throw std::overflow_error("ERA artifact summon count outside native range");
    return amount==0 ? 1 : static_cast<int>(amount);
}
struct DailyConversion { int from; int to; };
struct DailyConversionAction { std::size_t armySlot; int from; int to; };
using EquippedDailyConversions = std::array<std::vector<DailyConversion>, 19>;
// Input snapshots are deliberately by value. Simulating each immediate update
// preserves chains within one artifact and across later equipment slots.
inline std::vector<DailyConversionAction> planDailyConversions(
    std::array<int, 7> army, const EquippedDailyConversions & equipped)
{
    std::vector<DailyConversionAction> actions;
    for(const auto & artifact : equipped)
        for(const auto & pair : artifact)
            for(std::size_t slot = 0; slot < army.size(); ++slot)
                if(army[slot] >= 0 && army[slot] == pair.from && pair.from != pair.to)
                {
                    actions.push_back({slot, pair.from, pair.to});
                    army[slot] = pair.to;
                }
    return actions;
}
} // namespace era_bridge
