/* Original TUM197 per-side elemental summoning restriction; GPL-2.0-or-later. */
#pragma once
#include "EraBridgeArtifactPolicies.h"
#include "../CPlayerState.h"
#include "../battle/CBattleInfoCallback.h"
#include "../callback/IGameInfoCallback.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../entities/artifact/CArtifact.h"
#include "../entities/artifact/CArtifactInstance.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool sourceAllowsDifferentElementals(const CBattleInfoCallback & battle,BattleSide side)
{
    const auto * caster=battle.battleGetFightingHero(side);
    if(!caster)return false;
    // Source OnBattleRound0 exits for theoretical AI-only battles. Native
    // detailed combat has no theoretical H3 quick-combat execution branch.
    // A human must participate; the ring still belongs to the casting side.
    bool humanBattle=false;
    for(const auto candidate:{BattleSide::ATTACKER,BattleSide::DEFENDER})
        if(const auto * player=caster->cb->getPlayerState(battle.sideToPlayer(candidate),false))
            humanBattle=humanBattle||player->isHuman();
    if(!humanBattle)return false;
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=caster->getArt(ArtifactPosition(slot)))
            if(ArtifactPolicies::get().elementalFreedom(artifact->getType()->getJsonKey()))return true;
    return false;
}
}
VCMI_LIB_NAMESPACE_END
