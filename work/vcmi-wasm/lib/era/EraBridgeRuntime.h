#pragma once

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <limits>
#include <stdexcept>

// Portable semantic helpers, not an ERA DLL loader or a complete ERM runtime.
// Original behavior inspected in Knightmarevive/_h3era_plugins_, commit
// 99e949d9d910556e57d19914b41976d5a07da577:
// Amethyst2/amethyst/tables.cpp: Regeneration (5106-5128) and
// apply_rebirth (4056-4115). This independent implementation preserves the
// observed predicates/formula; it does not copy Windows hooks or assembly.
// Correspondence between that source revision and TUM's shipped DLL is not
// proven. Callers supply authoritative native RNG results and own event state.
namespace era_bridge
{
using Health = std::int64_t;

inline void require(bool valid, const char * message)
{
    if (!valid)
        throw std::invalid_argument(message);
}

// unitMaximumHP is the maximum HP of one creature, not the whole stack.
// This heals only the damaged first living creature; it cannot resurrect.
inline Health regeneration(Health currentFirstHP, Health unitMaximumHP,
                           Health points, int chancePercent, int roll0to99)
{
    require(unitMaximumHP > 0, "Maximum creature HP must be positive");
    require(currentFirstHP >= 0 && currentFirstHP <= unitMaximumHP,
            "Current first-creature HP is outside its range");
    require(points >= 0, "Regeneration HP must be nonnegative");
    require(chancePercent >= 0 && chancePercent <= 100,
            "Regeneration chance must be between 0 and 100");
    require(roll0to99 >= 0 && roll0to99 < 100,
            "Regeneration roll must be between 0 and 99");
    if (currentFirstHP == 0 || points == 0 || roll0to99 >= chancePercent)
        return 0;
    return std::min(points, unitMaximumHP - currentFirstHP);
}

struct RebirthResult
{
    Health health = 0;
    bool consumesCharge = false;
    bool marksUsed = false;
};

// Amethyst stores these three configuration values as floats, including
// creature-plus-stack aggregation. The observed comparison promotes chance
// to long double; HP calculation promotes the stored fraction/sure to double.
// Fractions are nonnegative but may exceed one after valid source aggregation.
// Reject unrepresentable arithmetic instead of relying on overflow behavior.
inline Health rawRebirthHealth(std::int64_t initialCount, Health unitHP,
                               float chance, float fraction, float sure,
                               int roll0to9999)
{
    require(initialCount >= 0, "Initial creature count must be nonnegative");
    require(unitHP > 0, "Creature HP must be positive");
    require(std::isfinite(chance) && chance >= 0.0f && chance <= 1.0f,
            "Rebirth chance must be finite and between 0 and 1");
    require(std::isfinite(fraction) && fraction >= 0.0f,
            "Rebirth random fraction must be finite and nonnegative");
    require(std::isfinite(sure) && sure >= 0.0f,
            "Rebirth guaranteed fraction must be finite and nonnegative");
    require(roll0to9999 >= 0 && roll0to9999 <= 9999,
            "Rebirth roll must be between 0 and 9999");
    if (initialCount > std::numeric_limits<Health>::max() / unitHP)
        throw std::overflow_error("Initial total creature HP cannot be represented");
    const Health maximum = initialCount * unitHP;
    const bool success = static_cast<long double>(chance) >
                         0.0001L * static_cast<long double>(roll0to9999);
    const double factor = static_cast<double>(sure) +
                          (success ? static_cast<double>(fraction) : 0.0);
    const double hp = static_cast<double>(maximum) * factor;
    // Conversion is defined only below 2^63. double(INT64_MAX) rounds to 2^63.
    if (!std::isfinite(hp) || hp >= std::ldexp(1.0, 63))
        throw std::overflow_error("Resurrection HP cannot be represented");
    return static_cast<Health>(hp); // Original formula truncates toward zero.
}

// Call only for a dead non-clone stack. The original function also checks
// stack eligibility before reaching this configuration-driven branch.
// The separate creature-experience rebirth branch is intentionally not modeled.
// No whole-creature count is inferred: the source delegates HP restoration to
// BattleMgr_ResurectArchangel and its resulting count/partial-HP behavior must
// be established at the native integration point.
inline RebirthResult rebirth(std::int64_t initialCount, Health unitHP,
                             float chance, float fraction, float sure,
                             int roll0to9999, int charges, bool alreadyUsed)
{
    require(charges >= 0, "Rebirth charges must be nonnegative");
    const Health raw = rawRebirthHealth(initialCount, unitHP, chance,
                                       fraction, sure, roll0to9999);
    if (alreadyUsed || charges == 0 || raw == 0)
        return {};
    return {std::max(unitHP, raw), true, true};
}

enum class ActionKind
{
    MeleeAttack,
    RangedAttack,
    CastSpell,
    Retaliation,
    Other
};

struct StatTransfer
{
    std::int64_t attackDelta = 0;
    std::int64_t defenseDelta = 0;
    bool applied = false;
};

// TUM source: Third-Upgrade-Mod-Full commit
// 120d8a6ff8cfed7453a09e7f9ce7c63bb3fed404, Data/s/Third Upgrade Mod.erm
// lines 725-748 (OnBeforeBattleAction, WALK_AND_ATTACK, defense > 0).
// The battle-log, FRENZY sound and animation are native-caller responsibilities.
// Contract supplied by the TUM Antichrist policy: one transfer before the
// actor's melee action when defense remains positive. The caller identifies
// the creature/policy and tracks whether this event was already applied.
// Returning deltas avoids local mutation; VCMI remains the state authority.
inline StatTransfer beforeMeleeStatTransfer(ActionKind action,
                                           std::int64_t attack,
                                           std::int64_t defense,
                                           bool alreadyAppliedForEvent = false)
{
    if (action != ActionKind::MeleeAttack || alreadyAppliedForEvent || defense <= 0)
        return {};
    if (attack > std::numeric_limits<std::int64_t>::max() - 3)
        throw std::overflow_error("Attack after stat transfer cannot be represented");
    return {3, -1, true};
}
} // namespace era_bridge
