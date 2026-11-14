#pragma once
#include "../../lib/era/EraSourceXpAdmission.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../../lib/battle/BattleInfo.h"
namespace era_compat_server {
// onBattleStarted only, BEFORE public DEFEND enrollment. Never called merely
// because DEFEND tags exist, and never retroactively on save deserialization.
inline void initializeSourceXpAdmission(CGameHandler &handler,const CBattleInfoCallback&battle)
{
 const auto&p=era_compat::SourceXpAdmissionPolicy::get();const auto&banks=era_compat::SourceBankXpPolicy::get();
 const auto&dwellings=era_compat::SourceDwellingXpPolicy::get();
 if((!p.enabled()&&!banks.enabled()&&!dwellings.enabled())||era_compat::sourceXpBattleAdmitted(battle))return;
 bool primary=false,bank=false,dwelling=false;
 for(const auto*stack:battle.battleGetAllStacks())
 {const auto&key=stack->creatureId().toCreature()->getJsonKey();primary|=p.ownsActor(key);bank|=banks.participates(key);dwelling|=dwellings.participates(key);}
 if(!primary&&!bank&&!dwelling)return;
 SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();
 for(const auto*stack:battle.battleGetAllStacks())
 {std::vector<Bonus> markers;if(primary){auto b=era_compat::sourceXpAdmissionEnrollment();b.hidden=true;markers.push_back(std::move(b));}if(bank){auto b=era_compat::sourceBankXpEnrollment();b.hidden=true;markers.push_back(std::move(b));}if(dwelling){auto b=era_compat::sourceDwellingXpEnrollment();b.hidden=true;markers.push_back(std::move(b));}packet.toAdd.emplace_back(stack->unitId(),std::move(markers));}
 if(!packet.toAdd.empty())handler.sendAndApply(packet);
}
}
