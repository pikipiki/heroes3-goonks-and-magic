/* Shared admission, ownership and placement rules for original troop deployment. */
#pragma once
#include "EraCampaignDeploymentRule.h"
#include <optional>
#include "EraCampaignJson.h"
#include "EraCampaignHints.h"
#include "../mapping/CMap.h"
#include "../filesystem/Filesystem.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_deployment
{
inline bool admitted(const JsonNode & state)
{
 if(!state.isStruct()||state["contract"].String()!="source-campaign-state-v1"||!state["vm"]["initialized"].Bool())return false;
 const auto path=JsonPath::builtin("config/era-campaigns/registry");if(!CResourceHandler::get()->existsResource(path))return false;
 static const JsonNode registry(path);
 for(const auto & entry:registry["programs"].Vector())if(entry["enabled"].Bool()&&entry["id"].String()==state["programId"].String()&&entry["programSha256"].String()==state["vm"]["programSha256"].String())return true;
 return false;
}
inline bool emptyLand(const CMap & map,const int3 & target,const JsonNode & state)
{
 if(!map.isInTheMap(target))return false;const auto & tile=map.getTile(target);
 return tile.isLand()&&!tile.blocked()&&!tile.visitable()&&state["tileIdentities"][era_campaign_hints::positionKey(target)].isNull();
}
inline std::optional<bool> ownerStyle(const JsonNode & state,int object,int owner,const int3 & position)
{
 if(!state.isStruct()||owner<0||owner>=8)return std::nullopt;
 const auto & record=state["leftTroops"][std::to_string(object)];if(!record.isStruct()||!record["owner"].isNumber()||record["owner"].Integer()!=owner||!record["takeBack"].isBool())return std::nullopt;
 const auto & pos=record["position"].Vector();if(pos.size()!=3||!pos[0].isNumber()||!pos[1].isNumber()||!pos[2].isNumber()||pos[0].Integer()!=position.x||pos[1].Integer()!=position.y||pos[2].Integer()!=position.z)return std::nullopt;
 return record["takeBack"].Bool();
}
}
VCMI_LIB_NAMESPACE_END
