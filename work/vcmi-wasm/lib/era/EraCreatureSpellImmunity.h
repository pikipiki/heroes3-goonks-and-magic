/* Third Upgrade Mod.erm OnMonsterPhysicalDamage/OnBattleActionEnd.
 * GPL-2.0-or-later. These narrow events are not ordinary spell immunity. */
#pragma once
#include <array>
namespace era_bridge
{
enum class CreatureSpellDamageOrigin
{
    Other, DeathStare, DeathCloud, FireShield, Fireball, Acid, Thunder, DeathRipple
};
inline constexpr bool sourceCreatureSpellImmune(int sourceId)
{
    return sourceId==283 || sourceId==346 || sourceId==347;
}
inline constexpr bool cancelsCreatureSpellDamage(int sourceId,
    CreatureSpellDamageOrigin origin,bool primaryTarget=false)
{
    if(!sourceCreatureSpellImmune(sourceId))return false;
    switch(origin)
    {
        case CreatureSpellDamageOrigin::DeathCloud:
        case CreatureSpellDamageOrigin::Fireball:return !primaryTarget;
        case CreatureSpellDamageOrigin::DeathStare:
        case CreatureSpellDamageOrigin::FireShield:
        case CreatureSpellDamageOrigin::Acid:
        case CreatureSpellDamageOrigin::Thunder:
        case CreatureSpellDamageOrigin::DeathRipple:return true;
        default:return false;
    }
}
// Source repeats52. Removal is idempotent; preserve its first occurrence.
inline constexpr std::array<int,15> sourceCreatureSpellCleanseIds=
    {42,52,45,54,50,62,59,60,61,70,71,72,73,74,75};
inline constexpr bool cleansesCreatureSpell(int spell)
{
    for(const int id:sourceCreatureSpellCleanseIds)if(id==spell)return true;
    return false;
}
}
