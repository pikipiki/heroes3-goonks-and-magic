/* Original347 additional_moves hook4645BA. Optional whole-actor policy only.
 * This header alone installs no action hook. GPL-2.0-or-later. */
#pragma once
#include "EraPrimordialMovesStateRuntime.h"
#include "../../lib/battle/BattleAction.h"
#include "../../lib/battle/CUnitState.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include <algorithm>
#include <optional>

namespace era_compat_server
{
inline int primordialOriginalAction(EActionType action)
{
    switch(action)
    {
    case EActionType::WALK:return 2;
    case EActionType::WALK_AND_ATTACK:return 6;
    case EActionType::SHOOT:return 7;
    case EActionType::CATAPULT:return 9;
    case EActionType::MONSTER_SPELL:return 10;
    default:return -1;
    }
}

// nullopt preserves ordinary native morale for unrelated creatures. A slot
// previously occupied by347 can retain a counter even after its replacement.
// true means ordinary positive morale; false means continue queue selection,
// including after an additional move clears DONE. Source4645BA does not force
// the same actor to be selected over another eligible, faster queued actor.
inline std::optional<bool> primordialAfterAction(CGameHandler & handler,
    const CBattleInfoCallback & battle,const CStack * actor,EActionType action)
{
    if(!era_compat::primordialMovesEnabled() || !actor)return std::nullopt;
    const int slot=era_bridge::primordialMoveSlot(int(actor->unitSide()),actor->sourceMassSlot());
    if(slot<0)return std::nullopt;
    auto cache=era_compat::primordialCachedMoves(battle);
    if(!cache)throw std::runtime_error("Original347 move cache must precede action selection");
    const bool movesTwice=era_compat::PrimordialPolicies::get().is347(actor->unitType()->getJsonKey());
    if(!movesTwice && (*cache)[slot]==0)return std::nullopt;
    if(!era_bridge::primordialMoraleEntry(battle.battleTacticDist()!=0,actor->defending,
        actor->hadMorale,actor->alive(),primordialOriginalAction(action)))return false;

    // Source4645A9 always draws1..24, including morale0/negative. It does
    // not use the native biased morale seed or guard on WAIT/canMove.
    const int morale=std::clamp(actor->moraleVal(),-3,3);
    if(handler.getRandomGenerator().nextInt(1,24)<=morale)
    {
        // Original4645C6 clears DONE26 and sets HAD_MORALE24, retaining
        // WAIT25. NativeStartAction clears transient waiting but retains the
        // authoritative per-round waitedThisTurn history. Restore only this
        // scoped source actor/slot residue, not ordinary native morale.
        if(actor->waitedThisTurn && !actor->waiting)
        {
            auto state=actor->acquireState();state->waiting=true;
            BattleUnitsChanged change;change.battleID=battle.getBattle()->getBattleID();
            change.changedStacks.emplace_back(actor->unitId(),UnitChanges::EOperation::RESET_STATE);
            state->save(change.changedStacks.back().data);handler.sendAndApply(change);
        }
        BattleTriggerEffect effect;
        effect.battleID=battle.getBattle()->getBattleID();effect.stackID=actor->unitId();
        effect.effect=BonusType::MORALE;effect.val=1;effect.additionalInfo=0;
        handler.sendAndApply(effect);
        return true;
    }
    const auto result=era_bridge::primordialFailedMorale((*cache)[slot],0,movesTwice);
    (*cache)[slot]=result.counter;
    writePrimordialMoves(handler,battle,*cache);
    if(result.grantedAction)
    {
        auto state=actor->acquireState();
        state->hadMorale=false;state->eraDoneRound=false;state->defending=false;
        state->movedThisRound=false;
        // Source F2FFFFFF retains WAIT25 on the additional-action path too.
        // Keep the unit in WAIT queue and avoid a new normal-turn regeneration
        // or negative-morale attempt after it has already waited this round.
        state->waiting=state->waitedThisTurn;
        // Native casting tracks a per-turn gate separately from the source
        // remaining-casts byte. A newly available action can spend another
        // charge; resetting this gate never replenishes the charge counter.
        state->castSpellThisTurn=false;
        BattleUnitsChanged change;change.battleID=battle.getBattle()->getBattleID();
        change.changedStacks.emplace_back(actor->unitId(),UnitChanges::EOperation::RESET_STATE);
        state->save(change.changedStacks.back().data);handler.sendAndApply(change);
    }
    return false;
}
}
