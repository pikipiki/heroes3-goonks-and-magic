/* Cached battlefield flag and corpse occupancy removal; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraOblivion.h"
#include "../../lib/CStack.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
inline void setupEraOblivion(CGameHandler & handler,const CBattleInfoCallback & battle)
{
    if(!era_compat::OblivionPolicy::enabled())return;
    for(const auto side:{BattleSide::ATTACKER,BattleSide::DEFENDER})
    {
        const auto * hero=battle.getBattle()->getSideHero(side);
        if(!hero)continue;
        for(int slot=0;slot<19;++slot)
            if(const auto * artifact=hero->getArt(ArtifactPosition(slot)))
                if(artifact->getType()->getJsonKey()=="tum-era:artifact268")
                {
                    Bonus marker;marker.type=BonusType::ERA_SOURCE_ARTIFACT_STATE;
                    marker.source=BonusSource::ARTIFACT;marker.sid=BonusSourceID(artifact->getTypeId());
                    marker.duration=BonusDuration::ONE_BATTLE;marker.hidden=true;marker.val=1;
                    marker.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{1,268});
                    GiveBonus packet(GiveBonus::ETarget::BATTLE,battle.getBattle()->getBattleID(),marker);
                    handler.sendAndApply(packet);return;
                }
    }
}
inline void removeEraOblivionCorpses(CGameHandler & handler,const CBattleInfoCallback & battle)
{
    if(!era_compat::sourceOblivionActive(battle))return;
    BattleUnitsChanged packet;packet.battleID=battle.getBattle()->getBattleID();
    std::vector<std::pair<uint32_t,int64_t>> temporaryCasualties;
    for(const auto * stack:battle.battleGetAllStacks(false))
    {
        const int slot=stack->sourceMassSlot();
        if(slot<0 || slot>41 || stack->alive() || stack->isGhost() || stack->isClone() || stack->isTurret())continue;
        bool occupied=false;
        for(const auto hex:stack->getHexes())
            if(battle.battleGetUnitByPos(hex,true)){occupied=true;break;}
        if(!occupied)
        {
            JsonNode state;auto saved=stack->acquire();saved->save(state);
            const auto temporary=state["state"]["health"]["resurrected"].Integer();
            if(temporary)temporaryCasualties.emplace_back(stack->unitId(),temporary);
            packet.changedStacks.emplace_back(stack->unitId(),UnitChanges::EOperation::REMOVE);
        }
    }
    // Neither operation sets summoned or erases the original army slot.
    if(!packet.changedStacks.empty())handler.sendAndApply(packet);
    if(!temporaryCasualties.empty())
    {
        BattleUnitsChanged restore;restore.battleID=packet.battleID;
        for(const auto & entry:temporaryCasualties)
            if(const auto * removed=battle.battleGetStackByID(entry.first,false))
            {
                JsonNode state;auto saved=removed->acquire();saved->save(state);
                // Keep native ghost/detachment and clone-link cleanup. Restore
                // only the casualty counter cleared by CHealth::reset().
                state["state"]["health"]["resurrected"].Integer()=entry.second;
                restore.changedStacks.emplace_back(entry.first,UnitChanges::EOperation::RESET_STATE);
                restore.changedStacks.back().data=std::move(state);
            }
        if(!restore.changedStacks.empty())handler.sendAndApply(restore);
    }
}
inline void carryEraOblivionResult(CGameHandler & handler,const CBattleInfoCallback & battle,const CGHeroInstance * winner)
{
    if(!winner || !era_compat::sourceOblivionActive(battle))return;
    // BattleResultAccepted deletes the battle before Necromancy is calculated.
    // Carry the cached flag through existing serialized bonus state rather than
    // adding an unversioned field to pending results or rechecking looted gear.
    const ArtifactID artifact(ArtifactID::decode("tum-era:artifact268"));
    Bonus marker;marker.type=BonusType::ERA_SOURCE_ARTIFACT_STATE;
    marker.source=BonusSource::ARTIFACT;marker.sid=BonusSourceID(artifact);
    marker.duration=BonusDuration::PERMANENT;marker.hidden=true;marker.val=1;
    marker.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{1,268,battle.getBattle()->getBattleID().getNum()});
    GiveBonus packet(GiveBonus::ETarget::OBJECT,winner->id,marker);handler.sendAndApply(packet);
}
inline void clearEraOblivionResult(CGameHandler & handler,const CGHeroInstance & hero,const BattleID & battleID)
{
    if(!era_compat::sourceOblivionResult(hero,battleID))return;
    RemoveBonus packet;packet.who=GiveBonus::ETarget::OBJECT;packet.whoID=hero.id;
    packet.source=BonusSource::ARTIFACT;packet.id=BonusSourceID(ArtifactID(ArtifactID::decode("tum-era:artifact268")));
    handler.sendAndApply(packet);
}
