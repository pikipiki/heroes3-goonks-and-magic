/* Source217u#48, reconstructed from71DF45..71E3F5. GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/CStack.h"
#include "../../lib/bonuses/BonusParameters.h"
#include "../../lib/battle/Unit.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "../../lib/era/EraBattleSlots.h"
#include "../../lib/era/EraSourceRoundTwoSummon.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../../lib/networkPacks/SetStackEffect.h"

inline void applyEraRoundTwoDemons(CGameHandler & handler,
    const CBattleInfoCallback & battle,const CStack * actor)
{
    if(!actor || !actor->alive() || battle.battleGetRound()!=2)
        return;
    int overlandSlot=actor->unitSlot().getNum();
    const auto converted=actor->getBonus(Selector::type()(BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON));
    if(converted && converted->parameters)overlandSlot=converted->parameters->toNumber();
    if(overlandSlot<0 || overlandSlot>6 || actor->hasBonusOfType(BonusType::ERA_SOURCE_UNOWNED_STACK))
        return;
    const auto policy=era_compat::Policies::get().sourceRoundTwoDemons(actor->creatureId().toCreature()->getJsonKey());
    if(!policy)return;
    const int rank=actor->base?std::clamp(actor->base->getExpRank(),0,10):0;
    const auto count=::era_bridge::sourceRoundTwoSummonCount(actor->getCount(),policy->at(rank));
    if(count<=0)return;
    const BattleSide side=battle.playerToSide(battle.battleGetOwner(actor));
    if(side!=BattleSide::ATTACKER && side!=BattleSide::DEFENDER)return;
    const auto positions=::era_bridge::sourcePitMasterSummonPositions(actor->getPosition().toInt(),side==BattleSide::DEFENDER);
    const auto accessibility=battle.getAccessibility();
    for(const int position:positions)
    {
        if(position<0)continue;
        const BattleHex hex(position);
        if(!accessibility.accessible(hex,false,side))continue;
        std::vector<::era_bridge::BattleSlotState> slots;
        for(const auto * stack:battle.battleGetAllStacks(false))
            if(stack->unitSide()==side)
                slots.push_back({stack->sourceMassSlot(),stack->alive()&&!stack->isGhost(),stack->summoned});
        if(!::era_bridge::allocateBattleSlot(slots).originalDomain)return;
        battle::UnitInfo info;
        info.id=battle.battleNextUnitId();info.type=CreatureID(48); // Original u#48 creates the unupgraded Demon48.
        info.side=side;info.position=hex;info.count=count;
        // Original714D22 uses flags0, sourceSlot-1. Keep SUMMON false: casualty
        // XP469F70 tests this bit independently from persistence463E61..68.
        info.summoned=false;
        BattleUnitsChanged packet;packet.battleID=battle.getBattle()->getBattleID();
        packet.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);
        info.save(packet.changedStacks.back().data);handler.sendAndApply(packet);
        std::vector<Bonus> markers;
        for(const auto type:{BonusType::ERA_SOURCE_UNOWNED_STACK,BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON})
        {
            Bonus bonus;bonus.type=type;bonus.val=1;bonus.hidden=true;
            bonus.duration=BonusDuration::ONE_BATTLE;bonus.source=BonusSource::CREATURE_ABILITY;
            bonus.sid=BonusSourceID(actor->creatureId());markers.push_back(bonus);
        }
        SetStackEffect effect;effect.battleID=packet.battleID;
        effect.toAdd.emplace_back(info.id,std::move(markers));handler.sendAndApply(effect);
        return; // Source returns immediately after first successful forward slot.
    }
}
