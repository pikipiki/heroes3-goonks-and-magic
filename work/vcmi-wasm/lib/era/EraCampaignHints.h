/* Original coordinate-bound object hints; GPL-2.0-or-later. */
#pragma once
#include "EraCampaignJson.h"
#include "../int3.h"
#include "../texts/TextOperations.h"
#include <optional>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_hints
{
inline std::string positionKey(const int3 & position)
{return std::to_string(position.x)+"/"+std::to_string(position.y)+"/"+std::to_string(position.z);}

inline std::optional<std::string> text(const JsonNode & root,const int3 & position,int day,int hero,bool human)
{
 if(root["contract"].String()!="source-campaign-state-v1")return std::nullopt;
 const auto & binding=root["objectDescriptions"][positionKey(position)];
 if(binding.isNull())return std::nullopt;
 const int index=era_campaign_json::integer(binding);if(index==0)return std::nullopt;
 if(index<1||index>1000)throw std::runtime_error("External source hint string table is not admitted");
 const auto vm=era_campaign_json::readState(root["vm"]);
 era_campaign::Context context;context.day=day;context.currentHero=hero;
 context.builtinFlag=[human](int flag){return flag==1000&&human;};
 auto result=era_campaign::formatText(era_campaign::lookup(vm.z,index),vm,context);
 // Original hints use a512-byte ANSI buffer. Preserve511 source characters
 // without splitting the UTF-8 characters used by the native port.
 const auto count=TextOperations::getUnicodeCharactersCount(result);
 if(count>511)TextOperations::trimRightUnicode(result,count-511);
 return result;
}
}
VCMI_LIB_NAMESPACE_END
