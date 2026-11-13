#pragma once
// Source278-only inventory binding. Optional policy absent => all existing paths unchanged.
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../entities/artifact/CArtifact.h"
#include "../entities/artifact/CArtifactInstance.h"
#include "../entities/artifact/CArtifactSet.h"
#include "../entities/artifact/CArtifactFittingSet.h"
#include "../entities/artifact/ArtifactUtils.h"
#include "../bonuses/BonusCustomTypes.h"
#include <array>
#include <functional>
#include <optional>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat {
class Eye278Policy {
 bool active=false;
public:
 Eye278Policy(){const auto file=JsonPath::builtin("config/era-eye278-composition");if(!CResourceHandler::get()->existsResource(file))return;const JsonNode root(file);
  static const std::array<std::string,5> pins={"96fc4d138b31a3dd7047f4b4f435c52de7e11cb3a8e45848b617e92d1392f4c5","d8f010beca62134487050decf0586fec9596e3256f92bba0827238cf4a7e7216","dc04f0b7edd92c84c3b209914d91f7ca2132dee3591ad454d395add15e461aa2","83ef75673d87662a9ffaeb6d1f1023f4d61007f4bff7264619971702d8e19dbd","581c59600b01b41b6e672364f2fb2df2dee8f4e53c287e9c0c505c0b712287d1"};
  if(!root.isStruct()||root.Struct().size()!=5||!root["schemaVersion"].isNumber()||root["schemaVersion"].Float()!=2||!root["contract"].isString()||root["contract"].String()!="source-eye278-direct-ids-v2"||!root["artifact"].isString()||root["artifact"].String()!="tum-era:artifact278"||!root["parts"].isVector()||root["parts"].Vector().size()!=4||!root["sourceCfgSha256"].isVector()||root["sourceCfgSha256"].Vector().size()!=5)throw std::runtime_error("Invalid source278 whole-composition contract");
  const std::array<int,4> ids={273,274,276,277};for(size_t i=0;i<ids.size();++i)if(!root["parts"].Vector()[i].isString()||root["parts"].Vector()[i].String()!="tum-era:artifact"+std::to_string(ids[i]))throw std::runtime_error("Changed source278 recipe");for(size_t i=0;i<pins.size();++i)if(!root["sourceCfgSha256"].Vector()[i].isString()||root["sourceCfgSha256"].Vector()[i].String()!=pins[i])throw std::runtime_error("Changed source278 CFG pin");active=true;}
 static bool enabled(){static const Eye278Policy p;return p.active;}
};
inline int eye278PartIndex(const CArtifact *type){if(!type)return -1;const std::array<int,4> ids={273,274,276,277};for(int i=0;i<4;++i)if(type->getJsonKey()=="tum-era:artifact"+std::to_string(ids[i]))return i;return -1;}
inline bool eye278Type(const CArtifact *type){return Eye278Policy::enabled()&&type&&type->getJsonKey()=="tum-era:artifact278";}
inline bool eye278GuiUncombineAllowed(const CArtifact *type){return !eye278Type(type);}
inline constexpr std::array<int,5> eye278Misc={9,10,11,12,18};
inline bool eye278IsMisc(ArtifactPosition slot){return std::find(eye278Misc.begin(),eye278Misc.end(),slot.num)!=eye278Misc.end();}
inline void validateEye278(const CArtifact *type){
 if(!eye278Type(type))throw std::runtime_error("Expected enabled source278 type");
 if(!type->isCombined()||type->isFused()||type->getConstituents().size()!=4)throw std::runtime_error("Source278 requires four genuine native constituents");
 std::array<const CArtifact*,4> parts{};for(const auto part:type->getConstituents()){const int i=eye278PartIndex(part);if(i<0||parts[i])throw std::runtime_error("Invalid source278 constituent identity");parts[i]=part;}
 const std::array<std::array<int,2>,5> expected={{{1,0},{0,1},{0,2},{2,2},{5,5}}};
 for(int i=0;i<5;++i){const auto item=i<4?parts[i]:type;auto slots=item->getPossibleSlots().at(ArtBearer::HERO);std::sort(slots.begin(),slots.end());if(slots!=std::vector<ArtifactPosition>{ArtifactPosition(9),ArtifactPosition(10),ArtifactPosition(11),ArtifactPosition(12),ArtifactPosition(18)})throw std::runtime_error("Changed source278 MISC slot contract");std::array<int,2> endpoints{};std::array<std::vector<int>,2> values;for(const auto&bonus:item->getExportedBonusList()){if(bonus->type!=BonusType::CREATURE_DAMAGE)throw std::runtime_error("Source278 exact static part contract has no additional bonus to inherit");if(bonus->subtype==BonusSubtypeID(BonusCustomSubtype::creatureDamageMin)){endpoints[0]+=bonus->val;values[0].push_back(bonus->val);}else if(bonus->subtype==BonusSubtypeID(BonusCustomSubtype::creatureDamageMax)){endpoints[1]+=bonus->val;values[1].push_back(bonus->val);}else throw std::runtime_error("Unexpected source278 damage subtype");if(bonus->valType!=BonusValueType::ADDITIVE_VALUE||bonus->effectRange!=BonusLimitEffect::NO_LIMIT)throw std::runtime_error("Unexpected source278 damage modifier");}
  std::array<std::vector<int>,2> wanted;if(expected[i][0])wanted[0].push_back(expected[i][0]);if(expected[i][1])wanted[1].push_back(expected[i][1]);for(auto&v:values)std::sort(v.begin(),v.end());if(values!=wanted)throw std::runtime_error("Source278 exact endpoint bonus count/values changed");
  if(endpoints!=expected[i]||item->isGrowing()||item->isCharged())throw std::runtime_error("Source278 direct-ID endpoints or static part contract changed");}
}
// Source events/ordinary IArt stats scan only the parent after assembly. The four
// pinned part types contain no effect other than their direct-ID custom damage
// and daily conversion policies. Keep their instances/slots, but no bonus edges.
inline bool inheritEye278Part(const CArtifactInstance &parent,const CArtifactInstance &part)
{
    if(!eye278Type(parent.getType()))return true;
    validateEye278(parent.getType());
    if(eye278PartIndex(part.getType())<0 || !part.getExportedBonusList().empty())
        throw std::runtime_error("Changed source278 part instance cannot use direct-ID contract");
    return false;
}
inline std::array<const CArtifactInstance*,4> eye278Parts(const CArtifactInstance &parent){validateEye278(parent.getType());std::array<const CArtifactInstance*,4> result{};if(parent.getPartsInfo().size()!=4)throw std::runtime_error("Source278 instance missing parts");for(const auto&part:parent.getPartsInfo()){const int i=eye278PartIndex(part.getArtifact()->getType());if(i<0||result[i])throw std::runtime_error("Source278 instance recipe mismatch");result[i]=part.getArtifact();}return result;}
// Map JSON loading precedes the live GameState callback. Resolve only these
// source278 helpers through the current map; nested fitting copies retain it.
// The scope restores a previous resolver on exceptions and nested imports.
// A whole recipe prepares source278 capacity once. Its constituent scan must
// consume real free slots, never repeatedly promise a virtual reservation move.
inline thread_local unsigned eye278NativeRecipeValidationDepth=0;
class Eye278NativeRecipeValidationScope
{
public:
    Eye278NativeRecipeValidationScope(){++eye278NativeRecipeValidationDepth;}
    ~Eye278NativeRecipeValidationScope(){--eye278NativeRecipeValidationDepth;}
    Eye278NativeRecipeValidationScope(const Eye278NativeRecipeValidationScope &)=delete;
    Eye278NativeRecipeValidationScope & operator=(const Eye278NativeRecipeValidationScope &)=delete;
};
using Eye278ArtifactResolver = std::function<const CArtifactInstance *(ArtifactInstanceID)>;
inline thread_local const Eye278ArtifactResolver * eye278ArtifactResolver = nullptr;
class Eye278ArtifactResolverScope
{
    const Eye278ArtifactResolver * previous;
public:
    explicit Eye278ArtifactResolverScope(const Eye278ArtifactResolver & resolver)
        : previous(eye278ArtifactResolver) { eye278ArtifactResolver=&resolver; }
    ~Eye278ArtifactResolverScope() { eye278ArtifactResolver=previous; }
    Eye278ArtifactResolverScope(const Eye278ArtifactResolverScope &)=delete;
    Eye278ArtifactResolverScope & operator=(const Eye278ArtifactResolverScope &)=delete;
};
inline const CArtifactInstance * eye278Resolve(const ArtSlotInfo & info)
{
    if(!info.getID().hasValue())return nullptr;
    return eye278ArtifactResolver?(*eye278ArtifactResolver)(info.getID()):info.getArt();
}
inline const CArtifactInstance * eye278LockOwner(const CArtifactSet &set,ArtifactPosition slot){
 if(!Eye278Policy::enabled()||set.bearerType()!=ArtBearer::HERO||!eye278IsMisc(slot))return nullptr;const auto info=set.getSlot(slot);if(!info||!info->locked||!eye278Resolve(*info))return nullptr;
 for(const auto&[pos,candidate]:set.artifactsWorn)if(!candidate.locked&&eye278Resolve(candidate)&&eye278Type(eye278Resolve(candidate)->getType())&&eye278Resolve(candidate)->isPart(eye278Resolve(*info))){eye278Parts(*eye278Resolve(candidate));return eye278Resolve(candidate);}return nullptr;
}
inline std::optional<ArtifactPosition> eye278Spare(const CArtifactSet &set,ArtifactPosition target){if(!eye278LockOwner(set,target))return std::nullopt;for(int slot:eye278Misc)if(set.isPositionFree(ArtifactPosition(slot)))return ArtifactPosition(slot);return std::nullopt;}
inline bool reflowEye278(CArtifactSet &set,ArtifactPosition target,bool updateActualInstance){const auto parent=eye278LockOwner(set,target);const auto spare=eye278Spare(set,target);if(!parent||!spare)return false;const auto info=*set.getSlot(target);set.artifactsWorn.erase(target);set.artifactsWorn.emplace(*spare,info);if(updateActualInstance){CArtifactSet::ArtPlacementMap placements;placements.emplace(eye278Resolve(info),*spare);const_cast<CArtifactInstance*>(parent)->addPlacementMap(placements);}return true;}
inline bool canMoveIntoEye278(const CArtifactSet &set,ArtifactPosition target,const CArtifactInstance &incoming){
 if(eye278NativeRecipeValidationDepth!=0||!eye278LockOwner(set,target))return false;const auto&allowed=incoming.getType()->getPossibleSlots().at(set.bearerType());if(std::find(allowed.begin(),allowed.end(),target)==allowed.end())return false;
 CArtifactFittingSet fit(set);const auto from=set.getArtPos(&incoming);
 // Remove the source and its genuine constituent reservations on the copy.
 if(ArtifactUtils::isSlotEquipment(from))fit.removeArtifact(from);
 if(!reflowEye278(fit,target,false))return false;
 // Target is free now: run the ordinary native recipe/slot validation. This
 // cannot return via this helper and must account for every extra ring/MISC.
 return incoming.getType()->canBePutAt(&fit,target);
}
struct Eye278Assembly {std::vector<ArtifactPosition> consumed;ArtifactPosition target;std::array<const CArtifactInstance*,4> parts;};
inline std::optional<Eye278Assembly> planEye278Assembly(const CArtifactSet &set,const CArtifact *type,ArtifactPosition selected){
 if(!eye278Type(type)||set.bearerType()!=ArtBearer::HERO||(selected!=ArtifactPosition::PRE_FIRST&&!eye278IsMisc(selected)))return std::nullopt;validateEye278(type);Eye278Assembly plan;std::array<bool,4> needed={true,true,true,true};
 auto consume=[&](ArtifactPosition slot){const auto art=set.getArt(slot);if(!art)return false;const int index=eye278PartIndex(art->getType());if(index<0||!needed[index])return false;needed[index]=false;plan.consumed.push_back(slot);plan.parts[index]=art;return true;};
 if(selected!=ArtifactPosition::PRE_FIRST&&!consume(selected))return std::nullopt;for(int i=18;i>=0;--i)consume(ArtifactPosition(i));if(std::find(needed.begin(),needed.end(),true)!=needed.end())return std::nullopt;
 CArtifactFittingSet fit(set);for(const auto slot:plan.consumed)fit.removeArtifact(slot);for(int slot:eye278Misc)if(fit.isPositionFree(ArtifactPosition(slot))&&type->canBePutAt(&fit,ArtifactPosition(slot))){plan.target=ArtifactPosition(slot);return plan;}return std::nullopt;
}
} // namespace era_compat
VCMI_LIB_NAMESPACE_END
