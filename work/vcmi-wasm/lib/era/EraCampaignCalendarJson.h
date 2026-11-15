/* Existing903 map state codec for UN:K/M; GPL-2.0-or-later. */
#pragma once
#include "EraCampaignCalendar.h"
#include "EraCampaignJson.h"
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_calendar_json
{
inline era_campaign_calendar::Settings read(const JsonNode & state)
{
 era_campaign_calendar::Settings value;
 if(state["contract"].String()!="source-campaign-state-v1")return value;
 const auto & node=state["calendar"];
 if(!node.isNull())
 {
  era_campaign_json::object(node);
  const auto number=[&](const char * key){return node[key].isNull()?0:era_campaign_json::integer(node[key]);};
  value={number("week"),number("message"),number("month"),number("creature")};
 }
 era_campaign_calendar::validate(value);return value;
}
inline void write(JsonNode & state,const era_campaign_calendar::Settings & value)
{
 era_campaign_calendar::validate(value);auto & node=state["calendar"];
 node["week"].Integer()=value.week;node["message"].Integer()=value.message;node["month"].Integer()=value.month;node["creature"].Integer()=value.creature;
}
inline std::optional<std::string> message(const JsonNode & state,int day)
{
 const auto settings=read(state);if(!settings.message)return std::nullopt;
 auto vm=era_campaign_json::readState(state["vm"]);era_campaign::Context context;context.day=day;
 return era_campaign::formatText(era_campaign::lookup(vm.z,settings.message),vm,context);
}
}
VCMI_LIB_NAMESPACE_END
