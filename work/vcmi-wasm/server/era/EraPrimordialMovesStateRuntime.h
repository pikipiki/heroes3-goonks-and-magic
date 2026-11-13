/* Source347 battle-scoped BYTE table. Not connected to BFP/action hooks yet.
 * GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraPrimordialMovesState.h"
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/networkPacks/PacksForClient.h"
namespace era_compat_server
{
inline void writePrimordialMoves(CGameHandler & handler,const CBattleInfoCallback & battle,
    const era_bridge::PrimordialMoveSlots & values)
{
    if(!era_compat::primordialMovesEnabled() || !battle.getBattle())return;
    const auto existing=era_compat::primordialCachedMoves(battle);
    if(existing && *existing==values)return;
    if(existing)
    {
        RemoveBonus remove;remove.who=GiveBonus::ETarget::BATTLE;
        remove.whoID=battle.getBattle()->getBattleID();remove.source=BonusSource::CREATURE_ABILITY;
        remove.id=era_compat::primordialMovesSource();handler.sendAndApply(remove);
    }
    Bonus marker;marker.type=BonusType::DEFENSIVE_STANCE;marker.val=0;marker.hidden=true;
    marker.source=BonusSource::CREATURE_ABILITY;marker.sid=era_compat::primordialMovesSource();
    marker.duration=BonusDuration::ONE_BATTLE;
    marker.parameters=std::make_shared<BonusParameters>(era_bridge::primordialEncodeMoves(values));
    GiveBonus packet(GiveBonus::ETarget::BATTLE,battle.getBattle()->getBattleID(),marker);
    handler.sendAndApply(packet);
}

// Call exactly once BEFORE the first native stack selection. A zero cache is
// retained even if there are no original347 actors initially: a later summon
// must not receive the original OnBattleRound(v997==0) initial seed.
inline void initializePrimordialMoves(CGameHandler & handler,const CBattleInfoCallback & battle,
    int originalRound)
{
    if(!era_compat::primordialMovesEnabled() || era_compat::primordialCachedMoves(battle))return;
    era_bridge::PrimordialMoveSlots values{};
    std::array<bool,42> seed{};
    for(const auto * stack:battle.battleGetAllStacks(false))
    {
        const int slot=era_bridge::primordialMoveSlot(int(stack->unitSide()),stack->sourceMassSlot());
        if(slot>=0 && era_compat::PrimordialPolicies::get().is347(stack->creatureId().toCreature()->getJsonKey()))seed[slot]=true;
    }
    era_bridge::primordialSeedMoves(values,seed,originalRound);
    writePrimordialMoves(handler,battle,values);
}
}
