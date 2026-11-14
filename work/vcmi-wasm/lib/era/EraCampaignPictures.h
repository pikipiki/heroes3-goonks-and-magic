/* Original IF:Q picture encodings, shared by native dialogs; GPL-2.0-or-later. */
#pragma once
#include "../networkPacks/Component.h"
#include <optional>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_pictures
{
template<typename ResolveCreature>
std::optional<Component> component(int type,int subtype,ResolveCreature resolveCreature)
{
 if(type<0)return std::nullopt;
 if((type>=0&&type<=7)||type==36)
 {
  const GameResID resource(type==36?6:type);
  if(subtype< -100000)return Component(ComponentType::RESOURCE,resource,subtype+100000);
  if(subtype<0)return Component(ComponentType::RESOURCE_PER_DAY,resource,-subtype);
  return Component(ComponentType::RESOURCE,resource,subtype);
 }
 if(type==8)return Component(ComponentType::ARTIFACT,ArtifactID(subtype));
 if(type==9)return Component(ComponentType::SPELL,SpellID(subtype));
 if(type==10)return Component(ComponentType::FLAG,PlayerColor(subtype));
 if(type>=11&&type<=13)return Component(ComponentType::LUCK,type==12?0:type==13?(subtype>0?-subtype:subtype):subtype);
 if(type>=14&&type<=16)return Component(ComponentType::MORALE,type==15?0:type==16?(subtype>0?-subtype:subtype):subtype);
 if(type==17)return subtype==-1?Component(ComponentType::LEVEL,1):Component(ComponentType::EXPERIENCE,subtype);
 if(type==20)
 {
  if(subtype<3||subtype>86)throw std::runtime_error("Invalid original secondary skill picture");
  return Component(ComponentType::SEC_SKILL,SecondarySkill(subtype/3-1),subtype%3+1);
 }
 if(type==21)
 {
  const auto raw=static_cast<std::uint32_t>(subtype);Component result(ComponentType::CREATURE,resolveCreature(raw&65535));
  if(raw>>16)result.value=raw>>16;return result;
 }
 if(type>=31&&type<=34)return Component(ComponentType::PRIM_SKILL,static_cast<PrimarySkill>(type-31),subtype);
 if(type==35)return Component(ComponentType::MANA,subtype);
 throw std::runtime_error("Unadmitted original campaign picture type "+std::to_string(type));
}
}
VCMI_LIB_NAMESPACE_END
