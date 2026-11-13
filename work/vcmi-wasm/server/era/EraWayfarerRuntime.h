/* Original OnEveryDay AI260: HE:Wd400/1 Gd400 after movement reset. */
#pragma once
#include "../../lib/era/EraWayfarerState.h"
#include "../../lib/era/EraWayfarerMovement.h"
#include "../CGameHandler.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/networkPacks/PacksForClient.h"
VCMI_LIB_NAMESPACE_BEGIN
inline void applyEraWayfarerDay(CGameHandler & handler,const PlayerState & player)
{
    if(player.human)return;
    const auto & policy=era_compat::WayfarerArtifact::get();
    const auto id=policy.artifact();if(!id)return;
    for(const auto * hero:player.getHeroes())
    {
        if(!policy.equipped(*hero))continue;
        const int day=handler.gameState().day;
        const auto old=era_compat::wayfarerDayState(*hero);
        if(old && old->day==day)continue;
        const bool onWater=hero->getBoat()!=nullptr;
        const std::vector<int32_t> data{1,260,day,onWater?1:0};
        Bonus maximum;maximum.type=BonusType::MOVEMENT;maximum.val=400;
        maximum.valType=BonusValueType::ADDITIVE_VALUE;
        maximum.subtype=BonusSubtypeID(onWater?BonusCustomSubtype::heroMovementSea:BonusCustomSubtype::heroMovementLand);
        maximum.duration=BonusDuration::ONE_DAY;maximum.source=BonusSource::ARTIFACT;maximum.sid=BonusSourceID(*id);
        maximum.parameters=std::make_shared<BonusParameters>(data);
        const auto current=hero->movementPointsRemaining();
        GiveBonus giveMaximum(GiveBonus::ETarget::OBJECT,hero->id,maximum);handler.sendAndApply(giveMaximum);
        SetMovePoints points(hero->id,::era_bridge::sourceWayfarerDailyRemaining(current));handler.sendAndApply(points);
        Bonus receipt;receipt.type=BonusType::ERA_SOURCE_ARTIFACT_STATE;receipt.val=1;receipt.hidden=true;
        receipt.duration=BonusDuration::ONE_DAY;receipt.source=BonusSource::ARTIFACT;receipt.sid=BonusSourceID(*id);
        receipt.parameters=std::make_shared<BonusParameters>(data);
        GiveBonus giveReceipt(GiveBonus::ETarget::OBJECT,hero->id,receipt);handler.sendAndApply(giveReceipt);
    }
}
VCMI_LIB_NAMESPACE_END
