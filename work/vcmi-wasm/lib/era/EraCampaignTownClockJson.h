/* Map-local source player clocks, replicated with existing campaign state. */
#pragma once
#include "EraCampaignTownClock.h"
#include "EraCampaignJson.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_town_clock_json
{
inline std::optional<int> read(const JsonNode & state,int player)
{
 if(state["contract"].String()!="source-campaign-state-v1")return std::nullopt;
 if(player<0||player>7)throw std::runtime_error("Invalid source countdown owner");
 const auto & node=state["townClocks"][std::to_string(player)];if(node.isNull())return std::nullopt;
 const int value=era_campaign_json::integer(node);era_campaign_town_clock::validate(value);return value;
}
}
VCMI_LIB_NAMESPACE_END
