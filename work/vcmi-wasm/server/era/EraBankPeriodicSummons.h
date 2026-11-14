/* Original330 U114: shared71DF45 periodic summon branch, not an elemental spell. */
#pragma once
#include "EraRoundTwoDemons.h"
#include "../../lib/era/EraBankActors.h"
#include "../../lib/era/EraSourceRoundTwoSummon.h"
#include <limits>

inline void applyEraBankPeriodicSummon(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor)
{
    if(!actor||!actor->alive()||era_compat::BankActors::get().sourceId(actor->unitType()->getJsonKey())!=330
        ||battle.battleGetRound()<2||(battle.battleGetRound()-2)%4!=0)return;
    int armySlot=actor->unitSlot().getNum();
    const auto converted=actor->getBonus(Selector::type()(BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON));
    if(converted&&converted->parameters)armySlot=converted->parameters->toNumber();
    if(armySlot<0||armySlot>6||actor->hasBonusOfType(BonusType::ERA_SOURCE_UNOWNED_STACK))return;
    const int rank=actor->base?std::clamp(actor->base->getExpRank(),0,10):0;
    const auto count=::era_bridge::sourceRoundTwoSummonCount(actor->getCount(),rank*20);
    if(count<=0||count>std::numeric_limits<int32_t>::max())return;
    const auto side=battle.playerToSide(battle.battleGetOwner(actor));
    if(side!=BattleSide::ATTACKER&&side!=BattleSide::DEFENDER)return;
    const auto positions=::era_bridge::sourcePitMasterSummonPositions(actor->getPosition().toInt(),side==BattleSide::DEFENDER,actor->doubleWide());
    const auto access=battle.getAccessibility();
    for(const int position:positions)
    {
        if(position<0||!access.accessible(BattleHex(position),false,side))continue;
        std::vector<::era_bridge::BattleSlotState> slots;
        for(const auto * stack:battle.battleGetAllStacks(false))if(stack->unitSide()==side)
            slots.push_back({stack->sourceMassSlot(),stack->alive()&&!stack->isGhost(),stack->summoned});
        if(!::era_bridge::allocateBattleSlot(slots).originalDomain)return;
        battle::UnitInfo info;info.id=battle.battleNextUnitId();info.type=CreatureID(114);
        info.side=side;info.position=BattleHex(position);info.count=count;info.summoned=false;
        BattleUnitsChanged change;change.battleID=battle.getBattle()->getBattleID();
        change.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);info.save(change.changedStacks.back().data);
        handler.sendAndApply(change);
        std::vector<Bonus> markers;
        for(const auto type:{BonusType::ERA_SOURCE_UNOWNED_STACK,BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON})
        {
            Bonus marker;marker.type=type;marker.val=1;marker.hidden=true;marker.duration=BonusDuration::ONE_BATTLE;
            marker.source=BonusSource::CREATURE_ABILITY;marker.sid=BonusSourceID(actor->creatureId());markers.push_back(marker);
        }
        SetStackEffect effect;effect.battleID=change.battleID;effect.toAdd.emplace_back(info.id,std::move(markers));
        handler.sendAndApply(effect);
        return;
    }
}
