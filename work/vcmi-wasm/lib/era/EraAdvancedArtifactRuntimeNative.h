/* Exact equipped180/220 contexts; no global army-strength or spell modifier. */
#pragma once
#include "EraAdvancedArtifactPolicies.h"
#include "EraAdvancedArtifactRuntime.h"
#include "../battle/CBattleInfoCallback.h"
#include "../battle/IBattleState.h"
#include "../CPlayerState.h"
#include "../battle/Unit.h"
#include "../entities/artifact/CArtifact.h"
#include "../entities/artifact/CArtifactInstance.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../spells/CSpellHandler.h"
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool sourceDiplomatEquipped(const CGHeroInstance & hero)
{
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero.getArt(ArtifactPosition(slot)))
            if(AdvancedArtifactPolicies::get().perceivedStrength(artifact->getType()->getJsonKey()))return true;
    return false;
}
inline int64_t sourceDiplomatGuildStrength(const PlayerState & player)
{
    uint64_t strength=0;
    constexpr auto limit=static_cast<uint64_t>(std::numeric_limits<int64_t>::max());
    for(const auto * hero:player.getHeroes())
        if(!hero->isGarrisoned())
        {
            const auto value=::era_bridge::diplomatPerceivedStrength(hero->getArmyStrength(),sourceDiplomatEquipped(*hero));
            strength=value>limit-strength?limit:strength+value;
        }
    return static_cast<int64_t>(strength);
}
inline bool sourceLightningRodEquipped(const CGHeroInstance * hero)
{
    if(!hero)return false;
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero->getArt(ArtifactPosition(slot)))
            if(AdvancedArtifactPolicies::get().lightningRod(artifact->getType()->getJsonKey()))return true;
    return false;
}
inline bool sourceLightningArtifactImmune(const CGHeroInstance * hero)
{
    if(!hero)return false;
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero->getArt(ArtifactPosition(slot)))
        {
            const auto & key=artifact->getType()->getJsonKey();
            if(key=="core:pendantOfNegativity" || key=="tum-era:artifact204")return true;
        }
    return false;
}
// nullopt retains native behavior when this source context is inactive.
inline std::optional<bool> sourceLightningReceptive(const CBattleInfoCallback & battle,int spell,
    BattleSide castingSide,const battle::Unit & target)
{
    if(!::era_bridge::lightningSpell(spell))return std::nullopt;
    const bool castingRod=sourceLightningRodEquipped(battle.getBattle()->getSideHero(castingSide));
    const auto otherSide=castingSide==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
    if(!castingRod && !sourceLightningRodEquipped(battle.getBattle()->getSideHero(otherSide)))return std::nullopt;
    if(sourceLightningArtifactImmune(battle.getBattle()->getSideHero(target.unitSide())))return false;
    return true;
}
inline std::optional<int> sourceLightningResistance(const CBattleInfoCallback & battle,int spell,
    BattleSide castingSide,const battle::Unit & target)
{
    const auto receptive=sourceLightningReceptive(battle,spell,castingSide,target);
    if(!receptive)return std::nullopt;
    if(!*receptive)return 100;
    const bool castingRod=sourceLightningRodEquipped(battle.getBattle()->getSideHero(castingSide));
    // MR:F100 is resistance, not absolute immunity: preserve native chain
    // traversal through resisted stacks without damage or consumed bounce.
    return ::era_bridge::lightningOwnChainProtected(spell,target.unitSide()==castingSide,castingRod)?100:0;
}
}
VCMI_LIB_NAMESPACE_END
