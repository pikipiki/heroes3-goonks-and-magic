/* Emerald equipped artifact summons; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/CStack.h"
#include "../../lib/era/EraBridgeArtifactPolicies.h"
#include "../../lib/era/EraBattleSlots.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include <numeric>
#include <vstd/RNG.h>

// Original5A7390 scans randomized rows, starting at x1/x15 and moving inward.
// Use the authoritative native RNG and native accessibility (including wide
// creatures); no browser placement or army mutation participates.
inline BattleHex eraArtifactSummonHex(CGameHandler & handler,
    const CBattleInfoCallback & battle, CreatureID creature, BattleSide side)
{
    const auto accessibility=battle.getAccessibility();
    const bool wide=creature.toCreature()->isDoubleWide();
    for(int column=1;column<15;++column)
    {
        std::vector<int> rows(11);std::iota(rows.begin(),rows.end(),0);
        const int x=side==BattleSide::ATTACKER ? column : 16-column;
        while(!rows.empty())
        {
            const int index=handler.getRandomGenerator().nextInt(0,static_cast<int>(rows.size())-1);
            const int y=rows[index];rows.erase(rows.begin()+index);
            const BattleHex hex(x,y);
            if(accessibility.accessible(hex,wide,side))return hex;
        }
    }
    return BattleHex::INVALID;
}

inline void applyEraArtifactOpeningSummons(CGameHandler & handler,
    const CBattleInfoCallback & battle, const CGHeroInstance & hero, BattleSide side)
{
    // Emerald events.cpp26..46: equipped slots0..18, then each cfg index0..8,
    // before this hero's opening spells. Locked components/backpack do not cast.
    for(int slot=0;slot<19;++slot)
    {
        const auto * artifact=hero.getArt(ArtifactPosition(slot));
        if(!artifact)continue;
        const auto * summons=era_compat::ArtifactPolicies::get().openingSummons(artifact->getType()->getJsonKey());
        if(!summons)continue;
        for(const auto & summon:*summons)
        {
            const CreatureID creature(summon.creature);
            const auto hex=eraArtifactSummonHex(handler,battle,creature,side);
            if(!hex.isValid())continue;
            std::vector<::era_bridge::BattleSlotState> slots;
            for(const auto * stack:battle.battleGetAllStacks(false))
                if(stack->unitSide()==side)
                    slots.push_back({stack->sourceMassSlot(),stack->alive()&&!stack->isGhost(),stack->summoned});
            // Source479A30 has twenty usable slots, reusing dead summoned units.
            if(!::era_bridge::allocateBattleSlot(slots).originalDomain)continue;
            battle::UnitInfo info;
            info.id=battle.battleNextUnitId();info.type=creature;info.side=side;
            info.position=hex;info.summoned=true;
            info.count=::era_bridge::artifactSummonCount(summon.encodedPower,hero.getPrimSkillLevel(PrimarySkill::SPELL_POWER));
            BattleUnitsChanged pack;pack.battleID=battle.getBattle()->getBattleID();
            pack.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);
            info.save(pack.changedStacks.back().data);handler.sendAndApply(pack);
            // Source saves/restores elemental summon state around every call.
            // Native exclusive elementals must therefore ignore these summons.
            Bonus marker;marker.type=BonusType::ERA_ARTIFACT_SUMMON;
            marker.val=1;marker.hidden=true;marker.duration=BonusDuration::ONE_BATTLE;
            marker.source=BonusSource::ARTIFACT;marker.sid=BonusSourceID(artifact->getTypeId());
            SetStackEffect effect;effect.battleID=pack.battleID;
            effect.toAdd.emplace_back(info.id,std::vector<Bonus>{marker});handler.sendAndApply(effect);
        }
    }
}
