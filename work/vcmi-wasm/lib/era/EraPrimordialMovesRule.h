/* Amethyst additional_moves[42], not a generic extra-turn bonus.
 * Source: dllmain.cpp334..363; tables.cpp3380..3400; H3 464500.
 * GPL-2.0-or-later. Optional runtime admission is deliberately separate. */
#pragma once
#include <array>
#include <cstdint>
#include <optional>
#include <vector>

namespace era_bridge
{
using PrimordialMoveSlots = std::array<std::uint8_t, 42>;

// Typed parameters for an inert battle bonus, independent of native stack IDs.
inline std::vector<std::int32_t> primordialEncodeMoves(const PrimordialMoveSlots & slots)
{
    std::vector<std::int32_t> result{1, 347, 42};
    for(const auto count : slots) result.push_back(count);
    return result;
}

inline std::optional<PrimordialMoveSlots> primordialDecodeMoves(const std::vector<std::int32_t> & data)
{
    if(data.size() != 45 || data[0] != 1 || data[1] != 347 || data[2] != 42)
        return std::nullopt;
    PrimordialMoveSlots slots{};
    for(unsigned i = 0; i < slots.size(); ++i)
    {
        if(data[i + 3] < 0 || data[i + 3] > 255) return std::nullopt;
        slots[i] = static_cast<std::uint8_t>(data[i + 3]);
    }
    return slots;
}

constexpr int primordialMoveSlot(int physicalSide, int sourceSlot)
{
    return physicalSide >= 0 && physicalSide < 2 && sourceSlot >= 0 && sourceSlot < 21
        ? physicalSide * 21 + sourceSlot : -1;
}

// OnBeforeBattleUniversal clears all42. OnBattleRound(v997==0) seeds only
// occupied MovesTwice slots, even a dead stack: original tests type>=0 only.
inline void primordialSeedMoves(PrimordialMoveSlots & counts,
    const std::array<bool, 42> & occupiedMovesTwice, int sourceRound)
{
    if(sourceRound != 0) return;
    for(unsigned i = 0; i < counts.size(); ++i)
        if(occupiedMovesTwice[i] && counts[i] == 0) counts[i] = 1;
}

constexpr bool primordialActionChecksMorale(int originalAction)
{
    return originalAction == 2 || originalAction == 6 || originalAction == 7
        || originalAction == 9 || originalAction == 10;
}

constexpr bool primordialMoraleEntry(bool tactics, bool defending, bool hadMorale,
    bool alive, int originalAction)
{
    return !tactics && !defending && !hadMorale && alive
        && primordialActionChecksMorale(originalAction);
}

struct PrimordialMoveResult
{
    std::uint8_t counter;
    std::uint32_t flags;
    bool grantedAction;
};

// Invoke ONLY after the original morale roll failed. A successful morale roll
// bypasses4645BA entirely, preserving this counter for later eligible actions.
constexpr PrimordialMoveResult primordialFailedMorale(std::uint8_t counter,
    std::uint32_t flags, bool movesTwice)
{
    if(counter != 0)
        return {static_cast<std::uint8_t>(counter - 1), flags & UINT32_C(0xf2ffffff), true};
    return {static_cast<std::uint8_t>(movesTwice ? 1 : 0), flags, false};
}
}
