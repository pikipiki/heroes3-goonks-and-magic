#pragma once
#include "../../lib/era/EraSourceXpAdmission.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../../lib/battle/BattleInfo.h"
namespace era_compat_server {
// onBattleStarted only, BEFORE public DEFEND enrollment. Never called merely
// because DEFEND tags exist, and never retroactively on save deserialization.
inline void initializeSourceXpAdmission(CGameHandler &handler,const CBattleInfoCallback&battle){const auto&p=era_compat::SourceXpAdmissionPolicy::get();if(!p.enabled()||era_compat::sourceXpBattleAdmitted(battle))return;bool participant=false;for(const auto*stack:battle.battleGetAllStacks())participant|=p.ownsActor(stack->creatureId().toCreature()->getJsonKey());if(!participant)return;SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();for(const auto*stack:battle.battleGetAllStacks()){auto marker=era_compat::sourceXpAdmissionEnrollment();marker.hidden=true;packet.toAdd.emplace_back(stack->unitId(),std::vector<Bonus>{std::move(marker)});}if(!packet.toAdd.empty())handler.sendAndApply(packet);}
}
