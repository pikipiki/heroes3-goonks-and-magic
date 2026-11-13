/* Source356 four independent u rows at round2. GPL-2.0-or-later. */
#pragma once
#include "EraRoundTwoDemons.h"
#include "../../lib/era/EraConfluxPolicies.h"
inline void applyEraConfluxRoundTwo(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor)
{
    if(!actor || !actor->alive() || battle.battleGetRound()!=2
        || !era_compat::ConfluxPolicies::get().is356(actor->creatureId().toCreature()->getJsonKey()))return;
    int slot=actor->unitSlot().getNum();
    const auto converted=actor->getBonus(Selector::type()(BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON));
    if(converted && converted->parameters)slot=converted->parameters->toNumber();
    if(slot<0 || slot>6 || actor->hasBonusOfType(BonusType::ERA_SOURCE_UNOWNED_STACK))return;
    constexpr std::array<int,11> percentages{0,2,5,5,10,10,15,15,20,20,25};
    const int rank=actor->base?std::clamp(actor->base->getExpRank(),0,10):0;
    const auto count=::era_bridge::sourceRoundTwoSummonCount(actor->getCount(),percentages[rank]);
    if(count<=0)return;
    const BattleSide side=battle.playerToSide(battle.battleGetOwner(actor));
    if(side!=BattleSide::ATTACKER && side!=BattleSide::DEFENDER)return;
    const auto positions=::era_bridge::sourcePitMasterSummonPositions(actor->getPosition().toInt(),side==BattleSide::DEFENDER,true);
    for(const int source:{112,113,114,115})
    {
        //71E3F5 returns to the14-record loop71DC79, not out of the caller.
        // Every row probes the same ordered3 cells again with fresh occupancy.
        const auto accessibility=battle.getAccessibility();
        for(const int position:positions)
        {
            if(position<0 || !accessibility.accessible(BattleHex(position),false,side))continue;
            std::vector<::era_bridge::BattleSlotState> slots;
            for(const auto * unit:battle.battleGetAllStacks(false))
                if(unit->unitSide()==side)slots.push_back({unit->sourceMassSlot(),unit->alive()&&!unit->isGhost(),unit->summoned});
            if(!::era_bridge::allocateBattleSlot(slots).originalDomain)break;
            battle::UnitInfo info;info.id=battle.battleNextUnitId();info.type=CreatureID(source);
            info.side=side;info.position=BattleHex(position);info.count=count;info.summoned=false;
            BattleUnitsChanged packet;packet.battleID=battle.getBattle()->getBattleID();
            packet.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);
            info.save(packet.changedStacks.back().data);handler.sendAndApply(packet);
            std::vector<Bonus> markers;
            for(const auto type:{BonusType::ERA_SOURCE_UNOWNED_STACK,BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON})
            {
                Bonus bonus;bonus.type=type;bonus.val=1;bonus.hidden=true;bonus.duration=BonusDuration::ONE_BATTLE;
                bonus.source=BonusSource::CREATURE_ABILITY;bonus.sid=BonusSourceID(actor->creatureId());markers.push_back(bonus);
            }
            SetStackEffect effect;effect.battleID=packet.battleID;
            effect.toAdd.emplace_back(info.id,std::move(markers));handler.sendAndApply(effect);
            break; // Next original record, not the next cell of this same record.
        }
    }
}
