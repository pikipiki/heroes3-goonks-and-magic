/* Source766A15 wrapper: full block71C5A9 before partial block71C710. */
#pragma once
#include "../../lib/era/EraCrystalExperienceRuntime.h"
#include "../../lib/era/EraDeflectionRuntime.h"
#include "../../lib/era/EraDeflectionLog.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/networkPacks/PacksForClientBattle.h"
#include "../CGameHandler.h"
namespace era_compat_server
{
inline int64_t applySourcePhysicalWrapper(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CStack * target,int64_t damage)
{
    if(!applyEraCrystalPhysicalBlock(target,handler.getRandomGenerator()))
        return applyEraDeflection(target,handler.getRandomGenerator(),damage,[&](int strength,int chance)
        {auto message=eraDeflectionLog(battle.getBattle()->getBattleID(),strength,chance);handler.sendAndApply(message);});
    BattleTriggerEffect blocked;blocked.battleID=battle.getBattle()->getBattleID();
    blocked.stackID=target->unitId();blocked.effect=BonusType::GENERAL_DAMAGE_REDUCTION;
    blocked.val=100;blocked.additionalInfo=85;handler.sendAndApply(blocked);
    BattleLogMessage message;message.battleID=battle.getBattle()->getBattleID();
    MetaString line;line.appendTextID("tum-era.deflection.fullBlock");message.lines.push_back(line);
    handler.sendAndApply(message);
    return 0;
}
}
