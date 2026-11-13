#pragma once
#include "../../lib/era/EraPrimordialState.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../CGameHandler.h"
namespace era_compat_server
{
inline void activatePrimordialDefending(CGameHandler & handler,const CBattleInfoCallback & battle,
    const battle::Unit * unit)
{
    if(!unit||!era_compat::primordialInitialDefending(*unit))return;
    const Bonus old=*era_compat::primordialDefendingMarker(*unit);Bonus processed=old;
    processed.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{1,347,27,0});
    SetStackEffect effect;effect.battleID=battle.getBattle()->getBattleID();
    effect.toRemove.emplace_back(unit->unitId(),std::vector<Bonus>{old});
    effect.toAdd.emplace_back(unit->unitId(),std::vector<Bonus>{processed});
    handler.sendAndApply(effect);
}
}
