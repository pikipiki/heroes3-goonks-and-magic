/* Source DEFEND snapshot, admitted for armies containing source241. */
#pragma once
#include "../../lib/era/EraSourceDefendState.h"
#include "../../lib/era/EraSourceDefendActionFrame.h"
#include <array>
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/json/JsonNode.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../CGameHandler.h"
namespace era_compat_server
{
class SourceDefendPolicy
{
 bool permit=false;
public:
 SourceDefendPolicy()
 {
     const auto path=JsonPath::builtin("config/era-bridge-source-defend");
     if(!CResourceHandler::get()->existsResource(path))return;
     const JsonNode node(path);
     if(!node.isStruct()||node.Struct().size()!=7||!node["schemaVersion"].isNumber()||node["schemaVersion"].Float()!=1
         ||!node["contract"].isString()||node["contract"].String()!="source-defend-state-v1"
         ||!node["sourceExecutableSha256"].isString()||node["sourceExecutableSha256"].String()!="451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181"
         ||!node["enabled"].isBool()||!node["enabled"].Bool()||!node["complete"].isBool()||!node["complete"].Bool()
         ||!node["nativeValidated"].isBool()||!node["nativeValidated"].Bool())
         throw std::runtime_error("Source DEFEND exact admitted policy required");
     const std::array<const char *,1> actors{"third-upgrades:tumChaoticDragonFly"};
     const auto & ids=node["actors"];if(!ids.isVector()||ids.Vector().size()!=actors.size())throw std::runtime_error("Source DEFEND exact source241 identity required");
     for(size_t i=0;i<actors.size();++i)if(!ids.Vector()[i].isString()||ids.Vector()[i].String()!=actors[i])throw std::runtime_error("Source DEFEND identity mismatch");
     permit=true;
 }
 bool enabled()const{return permit;}
 static const SourceDefendPolicy & get(){static SourceDefendPolicy p;return p;}
};
inline bool sourceDefendBattleEnrolled(const CBattleInfoCallback & battle)
{
 // Existing serialized enrollment remains authoritative after save/load,
 // including if the fixture config is no longer installed. Only creation of
 // NEW enrollment depends on the optional source policy.
 bool found=false;
 for(const auto * stack:battle.battleGetAllStacks())
     for(const auto & b:*stack->getBonuses(Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE))))
         if(b->stacking==era_compat::sourceDefendEnrollmentTag)
         {
             if(!b->parameters||b->parameters->toVector()!=std::vector<int32_t>{era_compat::sourceDefendSignature,1}
                 ||b->source!=BonusSource::OTHER||b->val!=0||b->duration!=BonusDuration::PERMANENT)
                 throw std::runtime_error("Malformed source DEFEND enrollment");
             found=true;
         }
 return found;
}
// Called ONLY by onBattleStarted, never on save deserialization/startNextRound.
inline void enrollSourceDefendNewBattle(CGameHandler & handler,const CBattleInfoCallback & battle)
{
 if(!SourceDefendPolicy::get().enabled())return;
 bool participant=false;for(const auto * stack:battle.battleGetAllStacks())
 {
     const auto & key=stack->creatureId().toCreature()->getJsonKey();
     participant|=key=="third-upgrades:tumChaoticDragonFly";
 }
 if(!participant||sourceDefendBattleEnrolled(battle))return;
 SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();
 for(const auto * stack:battle.battleGetAllStacks())
 {
     Bonus marker;marker.type=BonusType::PRIMARY_SKILL;marker.subtype=BonusSubtypeID(PrimarySkill::DEFENSE);
     marker.source=BonusSource::OTHER;marker.val=0;marker.hidden=true;marker.stacking=era_compat::sourceDefendEnrollmentTag;
     marker.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{era_compat::sourceDefendSignature,1});
     packet.toAdd.emplace_back(stack->unitId(),std::vector<Bonus>{marker});
 }
 if(!packet.toAdd.empty())handler.sendAndApply(packet);
}
inline bool prepareSourceXpDefend(const CBattleInfoCallback & battle,const CStack & stack,int & nativeDifference,std::vector<Bonus> & buffer)
{
 if(!sourceDefendBattleEnrolled(battle))return false;
 const auto base=Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE))
     .And(Selector::effectRange()(BonusLimitEffect::NO_LIMIT))
     .And([](const Bonus * b){return b->stacking!=era_compat::sourceDefendTag;});
 const int raw=era_bridge::sourceDefendSigned(static_cast<uint32_t>(stack.valOfBonuses(base)));
 const bool tactics=battle.battleTacticDist()!=0,siege=stack.hasBonusOfType(BonusType::SIEGE_WEAPON);
 // Native StartAction has already set stack.defending for THIS action.
 // Source47903C tests the flag that existed before the action instead.
 const auto priorDefending=era_bridge::sourceDefendBeforeAction(&stack);
 if(!priorDefending)throw std::runtime_error("Source DEFEND pre-StartAction snapshot required");
 const auto change=era_bridge::sourceDefend({raw,tactics,siege,*priorDefending});
 buffer.clear();nativeDifference=change.delta;
 if(!change.write)return true;
 // DEFENSIVE_STANCE is a native/Goonk extension with no original field. Preserve
 // its existing displayed delta at capture rather than discard its contribution.
 const bool nativeExtension=stack.valOfBonuses(BonusType::DEFENSIVE_STANCE)!=0&&!tactics&&!siege;
 if(nativeExtension)
 {
     BonusList native=*stack.getBonuses(Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE)));
     const int before=native.totalValue();
     Bonus percent;percent.type=BonusType::PRIMARY_SKILL;percent.subtype=BonusSubtypeID(PrimarySkill::DEFENSE);percent.val=20;percent.valType=BonusValueType::PERCENT_TO_ALL;
     Bonus stance=percent;stance.valType=BonusValueType::ADDITIVE_VALUE;stance.val=stack.valOfBonuses(BonusType::DEFENSIVE_STANCE);
     native.push_back(std::make_shared<Bonus>(percent));native.push_back(std::make_shared<Bonus>(stance));
     nativeDifference=native.totalValue()-before;if(nativeDifference==0)nativeDifference=1;
 }
 Bonus marker;marker.type=BonusType::PRIMARY_SKILL;marker.subtype=BonusSubtypeID(PrimarySkill::DEFENSE);
 marker.source=BonusSource::OTHER;marker.val=nativeDifference;marker.duration=BonusDuration::PERMANENT;
 marker.stacking=era_compat::sourceDefendTag;
 marker.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{era_compat::sourceDefendSignature,1,raw,nativeDifference,tactics?1:0,siege?1:0,nativeExtension?1:0,battle.battleGetRound()});
 buffer.push_back(marker);
 if(change.setDefending){Bonus tag=marker;tag.type=BonusType::UNIT_DEFENDING;tag.subtype=BonusSubtypeID();tag.val=0;tag.stacking=era_compat::sourceDefendFlagTag;buffer.push_back(tag);}
 return true;
}
// Source446B50 clears4DC/bit27 at the first activation in the next round,
// BEFORE regen/Fear. Native bool defending still resets in afterNewRound so
// queue selection is unchanged; this stored delta and bonus flag survive it.
inline void activateSourceXpDefending(CGameHandler & handler,const CBattleInfoCallback & battle,const battle::Unit * unit)
{
 if(!unit||!sourceDefendBattleEnrolled(battle))return;
 const auto state=era_compat::sourceDefendState(*unit);if(!state||!era_bridge::sourceDefendActivationClears((*state)[7],battle.battleGetRound()))return;
 std::vector<Bonus> removed;
 for(const auto & bonus:*unit->getBonuses(Selector::type()(BonusType::PRIMARY_SKILL).Or(Selector::type()(BonusType::UNIT_DEFENDING))))
     if(bonus->stacking==era_compat::sourceDefendTag||bonus->stacking==era_compat::sourceDefendFlagTag)removed.push_back(*bonus);
 if(!removed.empty())
 {
     SetStackEffect packet;packet.battleID=battle.getBattle()->getBattleID();packet.toRemove.emplace_back(unit->unitId(),std::move(removed));
     handler.sendAndApply(packet);
 }
}
}
