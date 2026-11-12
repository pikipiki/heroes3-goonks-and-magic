/* Original TUM262/263 sub-target power contract; GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>
namespace era_bridge
{
inline int artifactMassSpellPower(int heroPower)
{
    return static_cast<int>(std::clamp(static_cast<std::int64_t>(heroPower)*30/100,
        static_cast<std::int64_t>(1),static_cast<std::int64_t>(255)));
}
inline bool artifactMassSpellTarget(bool sameSide,bool friendlySpell,bool mainTarget,
    bool alive,bool arrowTower,int sourceSlot)
{
    return !mainTarget && alive && !arrowTower && sourceSlot>=0 && sourceSlot<21 && sameSide==friendlySpell;
}
}
