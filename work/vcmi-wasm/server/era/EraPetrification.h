/* Source-scoped Amethyst STONE selector5; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "EraStatusAttacks.h"
#include "EraCDispelRuntime.h"
#include "EraCSlowRuntime.h"
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "EraAcidAttackRuntime.h"
#include "../../lib/era/EraRustDragonling.h"
#include "../../lib/era/EraPetrificationPending.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/spells/ISpellMechanics.h"

// Lifetime is one accepted melee sequence, shared by normal, first and counter
// strikes. No persistent client state: nothing may observe an intermediate stone.
class EraPetrificationSequence
{
    era_bridge::PetrificationPending pending;
    std::map<uint32_t,PlayerColor> statusOwners;

    static spells::BattleCast event(const CBattleInfoCallback & battle,
        const spells::Caster * caster, SpellID spell)
    {
        spells::BattleCast cast(&battle, caster, spells::Mode::PASSIVE,
            spell.toSpell());
        // Original468CD8 passes power3/mastery0. Queued62/70..80 are exempt
        // from the global5A0145 power override; other queued spells use the
        // current active stack override (Slow54 is handled separately).
        cast.setSpellLevel(0);
        cast.setEffectPower(3);
        cast.setEffectDuration(3);
        return cast;
    }
public:
    void beforeAction(CGameHandler & handler,const CBattleInfoCallback & battle,
        const CStack * actor,const CStack * target)
    {
        if((era_compat_server::StatusAttacks::get().enabled(actor)
            || era_compat_server::StatusAttacks::get().queuedPoison(actor))
            && era_compat_server::selectSourceCPoison(handler,battle,actor,target))
        {
            pending.markSpell(target->unitId(),actor->unitId(),71);
            statusOwners[target->unitId()]=battle.battleGetOwner(actor);
        }
        else if(era_compat_server::StatusAttacks::get().intrinsicAge(actor)
            && actor->creatureId().toCreature()->getJsonKey()=="tum-era:redBonesDragon"
            && era_compat_server::selectSourceCAge(handler,battle,actor,target))
        {
            pending.markSpell(target->unitId(),actor->unitId(),75);
            statusOwners[target->unitId()]=battle.battleGetOwner(actor);
        }
        else if(era_compat_server::StatusAttacks::get().queuedSlow(actor)
            && era_compat_server::selectSourceCSlow(handler,battle,actor,target))
        {
            pending.markSpell(target->unitId(),actor->unitId(),54);
            statusOwners[target->unitId()]=battle.battleGetOwner(actor);
        }
        else if(era_compat_server::StatusAttacks::get().queuedDispel(actor)
            && era_compat_server::selectSourceCDispel(handler,battle,actor,target))
        {
            pending.markSpell(target->unitId(),actor->unitId(),78);
            statusOwners[target->unitId()]=battle.battleGetOwner(actor);
        }
    }
    void collect(CGameHandler & handler, const CBattleInfoCallback & battle,
        const CStack * attacker, const BattleAttack & attack, const CStack * primary = nullptr)
    {
        if(era_compat_server::AcidAttacks::get().queuedAcid(attacker)
            || (attacker && era_compat::RustDragonling::get().enabled(attacker->creatureId().toCreature()->getJsonKey())))
        {
            // SpellEffect8 original44050A: primary ONLY, alive+DEF>0,
            // no proc or magic-accuracy draws. Amethyst Toxic15 bypasses it.
            if(primary && primary->alive() && !primary->isGhost() && primary->getDefense(false)>0)
            {
                const int sourceId=era_compat::StatusAttacks::get().id(primary->creatureId().toCreature()->getJsonKey());
                if(sourceId!=335 && sourceId!=336 && sourceId!=339)
                {
                    pending.markSpell(primary->unitId(),attacker->unitId(),80);
                    statusOwners[primary->unitId()]=battle.battleGetOwner(attacker);
                }
            }
            return;
        }
        if(era_compat_server::StatusAttacks::get().intrinsicAge(attacker))
        {
            // Amethyst selector4 checks living and target life before its20% draw.
            // Only the primary target is visited, not breath/cloud collateral.
            if(primary && primary->alive() && era_compat_server::statusLiving(primary)
                && era_bridge::statusRollAccepts(20,handler.getRandomGenerator().nextInt(1,100))
                && era_compat_server::statusPrimaryAccepts(handler,battle,attacker,primary,SpellID(75)))
            {
                pending.markSpell(primary->unitId(),attacker->unitId(),75);
                statusOwners[primary->unitId()]=battle.battleGetOwner(attacker);
            }
            return;
        }
        const auto & status=era_compat_server::StatusAttacks::get();
        if(status.intrinsicBlind(attacker) || status.intrinsicStone(attacker))
        {
            const SpellID spell(status.intrinsicBlind(attacker)?62:70);
            if(era_compat_server::selectSourceIntrinsicStatus(handler,battle,attacker,primary,spell))
            {
                pending.markSpell(primary->unitId(),attacker->unitId(),spell.num);
                statusOwners[primary->unitId()]=battle.battleGetOwner(attacker);
            }
            return;
        }
        const auto & policy = era_compat::Policies::get();
        const auto & creature = attacker->creatureId().toCreature()->getJsonKey();
        if(!policy.petrification(creature) && !policy.blindness(creature))
            return;
        // Amethyst selector1 -> original44032D; selector5 ->440496. Both
        // write one target+EC marker, with spell62/70 respectively.
        const SpellID spellID(policy.blindness(creature) ? SpellID::BLIND : SpellID::STONE_GAZE);
        const auto ownerArmy = battle.getBattle()->getSideArmy(attacker->unitSide())->id;
        const auto * spell = spellID.toSpell();
        for(const auto & hit : attack.bsa)
        {
            // 44032D/440496 draw 1..100 before checking target life and receptivity.
            if(!handler.randomizer->rollCombatAbility(ownerArmy, 20))
                continue;
            const auto * target = battle.battleGetStackByID(hit.stackAttacked);
            if(!target || !target->alive())
                continue;
            spells::AbilityCaster caster(attacker, 0);
            auto cast = event(battle, &caster, spellID);
            spells::Target aim;
            aim.emplace_back(target);
            if(spell->battleMechanics(&cast)->canBeCastAt(aim))
            {
                pending.markSpell(target->unitId(), attacker->unitId(), spellID.num);
                // A fallback marker must not inherit another selector's owner/profile.
                statusOwners.erase(target->unitId());
            }
        }
    }

    void flush(CGameHandler & handler, const CBattleInfoCallback & battle)
    {
        // Original468C99 scans the army slots once. Successful additional hits
        // replace the one marker for a target; failed rolls do not erase it.
        for(const auto * target : battle.battleGetAllStacks(false))
        {
            const auto source = pending.source(target->unitId());
            if(!source || !target->alive())
                continue;
            const auto * attacker = battle.battleGetStackByID(*source,false);
            const auto queuedSpell=SpellID(pending.spell(target->unitId()));
            if(queuedSpell.num==54 && statusOwners.count(target->unitId()))
            {
                era_compat_server::applySourceCSlow(handler,battle,attacker,target,statusOwners.at(target->unitId()));
                continue;
            }
            if(queuedSpell.num==71 || queuedSpell.num==75 || queuedSpell.num==78 || queuedSpell.num==80 || ((queuedSpell.num==62 || queuedSpell.num==70) && statusOwners.count(target->unitId())))
            {
                // Original468CD8 does not repeat the earlier selector accuracy.
                era_compat_server::applySourceStatus(handler,battle,attacker,target,queuedSpell,0,statusOwners.at(target->unitId()));
                continue;
            }
            if(!attacker)continue;
            spells::AbilityCaster caster(attacker, 0);
            auto cast = event(battle, &caster, queuedSpell);
            spells::Target aim;
            aim.emplace_back(target);
            // Native casting supplies immunity/resistance handling and the
            // Stone Gaze animation, NOT_ACTIVE and damage-reduction effects.
            cast.castIfPossible(handler.spellcastEnvironment(), aim);
        }
        pending.clear();
        statusOwners.clear();
    }
};
