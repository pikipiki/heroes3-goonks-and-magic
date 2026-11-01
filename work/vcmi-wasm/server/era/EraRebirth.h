/* Source-scoped Amethyst rebirth, post-event scan; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/battle/CUnitState.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include <vstd/RNG.h>
#include <limits>
#include "../../lib/era/EraCloneHealScope.h"

inline void applyEraRebirth(CGameHandler & handler, const CBattleInfoCallback & battle)
{
    // Original469020 scans all slots after the complete event, not just its target.
    for(const auto * stack : battle.battleGetAllStacks(false))
    {
        if(stack->alive())
            continue;
        const auto policy = era_compat::Policies::get().rebirth(stack->creatureId().toCreature()->getJsonKey());
        if(!policy)
            continue;
        const auto removeFailedClone = [&]()
        {
            if(stack->isClone() && !stack->alive())
            {
                BattleUnitsChanged remove;
                remove.battleID = battle.getBattle()->getBattleID();
                remove.changedStacks.emplace_back(stack->unitId(), UnitChanges::EOperation::REMOVE);
                handler.sendAndApply(remove);
            }
        };
        if(stack->eraDoneRound)
        {
            removeFailedClone();
            continue;
        }
        auto state = stack->acquireState();
        const bool experienceEnabled = state->hasBonus(Selector::type()(BonusType::REBIRTH)
            .And(Selector::sourceTypeSel(BonusSource::STACK_EXPERIENCE)));
        auto & random = handler.getRandomGenerator();
        const int experienceRoll = random.nextInt(0, 9999);
        const int configuredRoll = random.nextInt(0, 9999);
        const auto configured = ::era_bridge::rebirth(state->unitBaseAmount(), state->getMaxHealth(),
            policy->chance, policy->fraction, policy->guaranteedFraction,
            configuredRoll, state->casts.canUse(1) ? 1 : 0, false);
        const auto experienceHealth = ::era_bridge::experienceRebirthHealth(
            state->unitBaseAmount(), state->getMaxHealth(), experienceEnabled, experienceRoll, false);

        auto applyPhase = [&](int64_t requestedHealth, bool consumeCharge)
        {
            if(requestedHealth <= 0)
                return;
            int64_t restoredHealth = requestedHealth;
            // Original5a7870 adds requestedHP to currentHP, capped by initialHP.
            {
                // Original5A7870 clears DEAD(bit21), retains CLONE(bit23).
                // Bypass only native generic heal rejection, then restore the
                // fragile-clone flag before any network state is published.
                ::era_bridge::CloneHealScope cloneScope(state->cloned);
                state->heal(restoredHealth, EHealLevel::RESURRECT, EHealPower::PERMANENT);
            }
            state->eraDoneRound = true;
            state->movedThisRound = true;
            state->waiting = false;
            state->ghost = false;
            state->ghostPending = false;
            if(consumeCharge)
                state->casts.use();
            // Original does not consume remaining retaliation charges.
            BattleStackAttacked rebirth;
            rebirth.stackAttacked = stack->unitId();
            rebirth.attackerID = std::numeric_limits<uint32_t>::max();
            rebirth.flags = BattleStackAttacked::REBIRTH;
            rebirth.killedAmount = 0;
            rebirth.damageAmount = 0;
            rebirth.newState.id = stack->unitId();
            rebirth.newState.operation = UnitChanges::EOperation::RESET_STATE;
            rebirth.newState.healthDelta = restoredHealth;
            state->save(rebirth.newState.data);
            StacksInjured change;
            change.battleID = battle.getBattle()->getBattleID();
            change.stacks.push_back(std::move(rebirth));
            handler.sendAndApply(change);
        };
        // Both source branches run in this order. Do not recheck DONE beforeXP:
        // configured rebirth sets it, but the original still performs the XP heal.
        applyPhase(configured.health, configured.consumesCharge);
        applyPhase(experienceHealth, false);
        removeFailedClone();
    }
}
