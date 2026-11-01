/* Authoritative ERA DONE bit26 timing; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "../../lib/battle/CUnitState.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"

inline void markEraDoneRound(CGameHandler & handler,
    const CBattleInfoCallback & battle, const CStack * stack)
{
    if(!stack || stack->eraDoneRound || !era_compat::Policies::get().rebirth(stack->unitType()->getJsonKey()))
        return;
    auto state = stack->acquireState();
    state->eraDoneRound = true;
    BattleUnitsChanged change;
    change.battleID = battle.getBattle()->getBattleID();
    change.changedStacks.emplace_back(stack->unitId(), UnitChanges::EOperation::RESET_STATE);
    state->save(change.changedStacks.back().data);
    handler.sendAndApply(change);
}
