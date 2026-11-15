/* Original CD policy, independent of the temporary Mysterious Cave gift. */
#pragma once
#include "EraCampaignAdmission.h"
#include "EraCampaignDemolitionData.h"
#include "EraCampaignJson.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_demolition
{
inline bool active(const JsonNode & vm,const JsonNode & world)
{
 return era_campaign_admission::admitted(vm)&&world["contract"].String()=="source-campaign-world-v1"&&world["programId"]==vm["programId"]&&world["programSha256"]==vm["vm"]["programSha256"]&&world["demolition"]["configured"].Bool();
}
inline JsonNode bind(const JsonNode & vm,const JsonNode & saved)
{
 JsonNode world=saved;
 if(world["programId"]!=vm["programId"]||world["programSha256"]!=vm["vm"]["programSha256"])world=JsonNode();
 world["contract"].String()="source-campaign-world-v1";world["programId"]=vm["programId"];world["programSha256"]=vm["vm"]["programSha256"];world["demolition"]["configured"].Bool()=true;
 return world;
}
inline int setting(const JsonNode & world,const std::string & key,int fallback)
{
 const auto & value=world["demolition"]["settings"][key];return value.isNull()?fallback:era_campaign_json::integer(value);
}
inline int minimum(const JsonNode & world,int faction,int building,bool army)
{
 const auto rule=thresholds.at(faction).at(building);
 return setting(world,std::string(army?"A:":"E:")+std::to_string(faction)+":"+std::to_string(building),army?rule.armyHealth:rule.experience);
}
}
VCMI_LIB_NAMESPACE_END
