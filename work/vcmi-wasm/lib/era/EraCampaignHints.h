/* Original coordinate-bound object hints; GPL-2.0-or-later. */
#pragma once
#include "EraCampaignJson.h"
#include "EraCampaignTypeHintRule.h"
#include "EraSourceCreatureLevels.h"
#include "../GameLibrary.h"
#include "../mapping/MapFormatSettings.h"
#include "../mapObjects/CGObjectInstance.h"
#include "../CCreatureHandler.h"
#include "../int3.h"
#include "../texts/TextOperations.h"
#include <optional>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_hints
{
inline std::string positionKey(const int3 & position)
{return std::to_string(position.x)+"/"+std::to_string(position.y)+"/"+std::to_string(position.z);}

inline std::optional<std::string> format(const JsonNode & root,const JsonNode & binding,int day,int hero,bool human)
{
 if(root["contract"].String()!="source-campaign-state-v1")return std::nullopt;
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
inline ObjectTypeIdentifier identity(const JsonNode & root,const CGObjectInstance & object)
{
 const auto & tile=root["tileIdentities"][positionKey(object.visitablePos())];
 const auto & saved=tile.isNull()?root["objectIdentities"][std::to_string(object.id.getNum())]:tile;
 if(!saved.isNull())
 {
  const auto & pair=era_campaign_json::array(saved);if(pair.size()!=2)throw std::runtime_error("Invalid source hint identity");
  return {Obj(era_campaign_json::integer(pair[0])),era_campaign_json::integer(pair[1])};
 }
 if(object.ID==Obj::MONSTER)
  if(const auto source=era_bridge::sourceCreatureIdForLevel(CreatureID(object.subID.getNum()).toCreature()->getJsonKey()))return {Obj::MONSTER,*source};
 const ObjectTypeIdentifier native{Obj(object.ID.getNum()),object.subID.getNum()};
 return LIBRARY->mapFormat->getMapping(EMapFormat::WOG).originalObject(native).value_or(native);
}
inline std::optional<std::string> text(const JsonNode & root,const int3 & position,int day,int hero,bool human,const CGObjectInstance * object=nullptr)
{
 if(const auto direct=format(root,root["objectDescriptions"][positionKey(position)],day,hero,human))return direct;
 if(!object||root["contract"].String()!="source-campaign-state-v1"||!root["typeHints"].isVector())return std::nullopt;
 const auto source=identity(root,*object);const auto vm=era_campaign_json::readState(root["vm"]);
 // Original FindObjExt scans the registration slots for an exact subtype,
 // then scans them again with subtype255. A deleted slot is reused first.
 for(const int subtype:{source.subID,255})for(const auto & hint:root["typeHints"].Vector())
 {
  if(hint.isNull())continue;const auto raw=hint["key"].Integer();if(raw<0||raw>UINT32_MAX)throw std::runtime_error("Invalid source type hint key");
  const auto readW=[&](int index){if(hero<0)return INT32_MIN;const auto selected=vm.w.find(hero);return selected==vm.w.end()?0:era_campaign::lookup(selected->second,index);};
  const auto readV=[&](int index){return era_campaign::lookup(vm.v,index);};
  if(era_campaign_type_hints::accepts(static_cast<std::uint32_t>(raw),int(source.ID),subtype,readW,readV))
   return format(root,hint["string"],day,hero,human);
 }
 return std::nullopt;
}
inline std::optional<std::string> heroText(const JsonNode & root,int target,int day,int hero,bool human)
{return format(root,root["heroDescriptions"][std::to_string(target)],day,hero,human);}
}
VCMI_LIB_NAMESPACE_END
