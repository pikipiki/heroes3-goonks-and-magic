/* Original316u193,322l26/l82 and323U83/U27: source row order, fresh placement per row. */
#pragma once
#include "EraRoundTwoDemons.h"
#include "../../lib/era/EraDwellingServices.h"
#include "../../lib/era/EraSourceRoundTwoSummon.h"
#include <limits>
#include "../../lib/IGameSettings.h"
#include "../../lib/callback/IGameInfoCallback.h"

inline void applyEraDwellingPeriodicSummons(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor)
{
    if(!actor||!actor->alive()||!handler.gameInfo().getSettings().getBoolean(EGameSettings::MODULE_STACK_EXPERIENCE))return;
    const auto key=actor->unitType()->getJsonKey();const int source=key=="tum-era:eraCreature316"?316:key=="tum-era:eraCreature323"?323:key=="tum-era:eraCreature322"?322:key=="tum-era:eraCreature288"?288:-1;
    if(!era_compat::DwellingServices::get().actor(source,key)||battle.battleGetRound()<2
      ||(source==316?battle.battleGetRound()!=2:(source==323||source==288)?(battle.battleGetRound()-2)%4!=0:false))return;
    int armySlot=actor->unitSlot().getNum();
    const auto converted=actor->getBonus(Selector::type()(BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON));
    if(converted&&converted->parameters)armySlot=converted->parameters->toNumber();
    if(armySlot<0||armySlot>6||actor->hasBonusOfType(BonusType::ERA_SOURCE_UNOWNED_STACK))return;
    const int rank=actor->base?std::clamp(actor->base->getExpRank(),0,10):0;
    struct Row{const char*target;std::array<int,11>percent;};
    const std::vector<Row> rows=source==316?std::vector<Row>{{"wake-of-gods.creatures:wogSorceress",{0,2,4,6,8,10,12,14,16,18,20}}}:
      source==288?std::vector<Row>{{"core:iceElemental",{0,5,10,15,20,25,30,35,40,45,50}}}:
      source==322?std::vector<Row>{{"core:greenDragon",{1,5,10,15,20,25,25,30,30,35,35}},{"core:redDragon",{0,0,0,0,0,0,15,20,25,30,35}}}:
      std::vector<Row>{{"core:blackDragon",{1,5,10,15,20,25,25,30,30,35,35}},{"core:goldDragon",{0,0,0,0,0,0,15,20,25,30,35}}};
    for(const auto & row:rows){
    const auto count=::era_bridge::sourceRoundTwoSummonCount(actor->getCount(),row.percent[rank]);
    if(count<=0||count>std::numeric_limits<int32_t>::max())continue;
    const auto side=battle.playerToSide(battle.battleGetOwner(actor));
    if(side!=BattleSide::ATTACKER&&side!=BattleSide::DEFENDER)return;
    const auto positions=::era_bridge::sourcePitMasterSummonPositions(actor->getPosition().toInt(),side==BattleSide::DEFENDER,actor->doubleWide());
    const auto target=CreatureID(CreatureID::decode(row.target));
    const auto access=battle.getAccessibility();
    for(const int position:positions)
    {
        if(position<0||!access.accessible(BattleHex(position),target.toCreature()->isDoubleWide(),side))continue;
        std::vector<::era_bridge::BattleSlotState> slots;
        for(const auto * stack:battle.battleGetAllStacks(false))if(stack->unitSide()==side)
            slots.push_back({stack->sourceMassSlot(),stack->alive()&&!stack->isGhost(),stack->summoned});
        if(!::era_bridge::allocateBattleSlot(slots).originalDomain)return;
        battle::UnitInfo info;info.id=battle.battleNextUnitId();info.type=target;
        info.side=side;info.position=BattleHex(position);info.count=count;info.summoned=source==322;
        BattleUnitsChanged change;change.battleID=battle.getBattle()->getBattleID();
        change.changedStacks.emplace_back(info.id,UnitChanges::EOperation::ADD);info.save(change.changedStacks.back().data);
        handler.sendAndApply(change);
        if(source==322)
        {
            const auto * clone=battle.battleGetUnitByID(info.id);
            auto state=clone->acquireState();state->cloned=true;
            BattleUnitsChanged flags;flags.battleID=change.battleID;
            flags.changedStacks.emplace_back(info.id,UnitChanges::EOperation::RESET_STATE);
            state->save(flags.changedStacks.back().data);handler.sendAndApply(flags);
        }
        std::vector<Bonus> markers;
        for(const auto type:{BonusType::ERA_SOURCE_UNOWNED_STACK,BonusType::ERA_SOURCE_NON_ELEMENTAL_SUMMON})
        {
            Bonus marker;marker.type=type;marker.val=1;marker.hidden=true;marker.duration=BonusDuration::ONE_BATTLE;
            marker.source=BonusSource::CREATURE_ABILITY;marker.sid=BonusSourceID(actor->creatureId());markers.push_back(marker);
        }
        if(source==316){Bonus hate;hate.type=BonusType::ERA_PERSONAL_HATE_DAMAGE;hate.val=200;hate.subtype=BonusSubtypeID(CreatureID(CreatureID::decode("third-upgrades:tumSupremeArchMage")));hate.source=BonusSource::CREATURE_ABILITY;hate.sid=BonusSourceID(target);hate.duration=BonusDuration::ONE_BATTLE;markers.push_back(hate);}
        SetStackEffect effect;effect.battleID=change.battleID;effect.toAdd.emplace_back(info.id,std::move(markers));
        handler.sendAndApply(effect);
        break;
    }
    }
}
