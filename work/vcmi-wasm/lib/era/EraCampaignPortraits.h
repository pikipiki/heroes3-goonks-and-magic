/* Map-local original hero portrait definitions; GPL-2.0-or-later. */
#pragma once
#include "../json/JsonNode.h"
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_portraits
{
inline const JsonNode & definition(const JsonNode & state,int icon)
{
 static const JsonNode empty;
 if(state["contract"].String()!="source-campaign-state-v1")return empty;
 return state["heroPortraits"][std::to_string(icon)];
}
inline std::string image(const JsonNode & state,int icon,bool large)
{
 const auto & item=definition(state,icon);
 return item.isStruct()?item[large?"large":"small"].String():std::string();
}
inline int originalFrame(const JsonNode & state,int icon,bool large)
{
 const auto & item=definition(state,icon);
 const auto & value=item[large?"largeFrame":"smallFrame"];
 return value.isNumber()?static_cast<int>(value.Integer()):-1;
}
}
VCMI_LIB_NAMESPACE_END
