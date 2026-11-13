/* Original286 U60 every4 rounds from round2. GPL-2.0-or-later. */
#pragma once
#include "EraRoundTwoDemons.h"
#include "../../lib/era/EraDemilichSummons.h"
inline void applyEraDemilichSummon(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor)
{
    const auto & policy=era_compat::DemilichSummons::get();
    if(!actor||!actor->alive()||!policy.enabled(actor->creatureId().toCreature()->getJsonKey())
        ||!::era_bridge::demilichSummonRound(battle.battleGetRound()))return;
    int overland=actor->unitSlot().getNum();
    const auto converted=actor->getBonus(Selector::type()(BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON));
    if(converted&&converted->parameters)overland=converted->parameters->toNumber();
    if(overland<0||overland>6||actor->hasBonusOfType(BonusType::ERA_SOURCE_UNOWNED_STACK))return;
    const int rank=actor->base?std::clamp(actor->base->getExpRank(),0,10):0;
    const auto count=::era_bridge::demilichSummonCount(actor->getCount(),rank);if(count<=0)return;
    const auto side=battle.playerToSide(battle.battleGetOwner(actor));
    if(side!=BattleSide::ATTACKER&&side!=BattleSide::DEFENDER)return;
    const auto positions=::era_bridge::sourcePitMasterSummonPositions(actor->getPosition().toInt(),side==BattleSide::DEFENDER);
    const auto accessibility=battle.getAccessibility();
    for(const int position:positions)
    {
        if(position<0||!accessibility.accessible(BattleHex(position),false,side))continue;
        std::vector<::era_bridge::BattleSlotState> slots;
        for(const auto * stack:battle.battleGetAllStacks(false))if(stack->unitSide()==side)
            slots.push_back({stack->sourceMassSlot(),stack->alive()&&!stack->isGhost(),stack->summoned});
        if(!::era_bridge::allocateBattleSlot(slots).originalDomain)return;
        battle::UnitInfo info;info.id=battle.battleNextUnitId();info.type=policy.summonedCreature();
        info.side=side;info.position=BattleHex(position);info.count=count;info.summoned=false;
        BattleUnitsChanged packet;packet.battleID=battle.getBattle()->getBattleID();
        packet.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);info.save(packet.changedStacks.back().data);handler.sendAndApply(packet);
        std::vector<Bonus> markers;
        for(const auto type:{BonusType::ERA_SOURCE_UNOWNED_STACK,BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON})
        {
            Bonus marker;marker.type=type;marker.val=1;marker.hidden=true;marker.duration=BonusDuration::ONE_BATTLE;
            marker.source=BonusSource::CREATURE_ABILITY;marker.sid=BonusSourceID(actor->creatureId());markers.push_back(marker);
        }
        SetStackEffect effect;effect.battleID=packet.battleID;effect.toAdd.emplace_back(info.id,std::move(markers));handler.sendAndApply(effect);
        return;
    }
}
