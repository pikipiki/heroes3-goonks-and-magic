/* Optional typed4DC snapshot. Missing source enrollment leaves native unchanged. */
#pragma once
#include "EraSourceDefendRule.h"
#include "EraXpTimed184State.h"
#include "../battle/Unit.h"
#include "../bonuses/BonusList.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/BonusSelector.h"
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline constexpr const char * sourceDefendTag="eraSourceXpDefend:state:v1";
inline constexpr const char * sourceDefendEnrollmentTag="eraSourceXpDefend:enrolled:v1";
inline constexpr const char * sourceDefendFlagTag="eraSourceXpDefend:flag:v1";
inline constexpr int sourceDefendSignature=0x58444443;
inline bool sourceDefendOwnedTag(std::string_view tag)
{return tag==sourceDefendTag||tag==sourceDefendEnrollmentTag||tag==sourceDefendFlagTag;}
inline std::optional<bool> sourceDefendRemovalIdentity(const Bonus & request,const Bonus & candidate)
{
 if(!sourceDefendOwnedTag(request.stacking)&&!sourceDefendOwnedTag(candidate.stacking))return std::nullopt;
 if(request.stacking!=candidate.stacking||!request.parameters||!candidate.parameters)return false;
 return request.parameters->toVector()==candidate.parameters->toVector()
     &&request.turnsRemain==candidate.turnsRemain;
}
inline std::optional<std::vector<int32_t>> sourceDefendState(const battle::Unit & unit)
{
 std::optional<std::vector<int32_t>> result;
 const auto sourceBonusList29=unit.getBonuses(Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE)));
 for(const auto & bonus:*sourceBonusList29)
 {
     if(bonus->stacking!=sourceDefendTag)continue;
     if(result||!bonus->parameters||bonus->source!=BonusSource::OTHER||bonus->duration!=BonusDuration::PERMANENT
         ||bonus->valType!=BonusValueType::ADDITIVE_VALUE||bonus->effectRange!=BonusLimitEffect::NO_LIMIT)
         throw std::runtime_error("Ambiguous source DEFEND4DC state");
     auto p=bonus->parameters->toVector();
     if(p.size()!=8||p[0]!=sourceDefendSignature||p[1]!=1||p[3]!=bonus->val
         ||p[4]<0||p[4]>1||p[5]<0||p[5]>1||p[6]<0||p[6]>1||p[7]<-1)
         throw std::runtime_error("Malformed source DEFEND4DC state");
     if(p[6]==0&&era_bridge::sourceDefend({p[2],p[4]!=0,p[5]!=0,false}).delta!=p[3])
         throw std::runtime_error("Source DEFEND4DC formula mismatch");
     result=std::move(p);
 }
 return result;
}
inline int sourceDefendDefense(const battle::Unit & unit,bool ranged,int nativeCached)
{
 const auto state=sourceDefendState(unit);if(!state&&!sourceTimedStatActive(unit))return nativeCached;
 // Add stored4DC AFTER all other native bonuses, so Goonk DEF% cannot rescale
 // the snapshot itself. All unrelated bonus arithmetic remains native.
 const auto range=Selector::effectRange()(BonusLimitEffect::NO_LIMIT)
     .Or(Selector::effectRange()(ranged?BonusLimitEffect::ONLY_DISTANCE_FIGHT:BonusLimitEffect::ONLY_MELEE_FIGHT));
 const auto others=Selector::typeSubtype(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE))
     .And(range).And([](const Bonus * b){return b->stacking!=sourceDefendTag&&!xpTimed184StatProjection(b);});
 return era_bridge::sourceDefendAdd(xpTimed184DefenseAfterNative(era_bridge::sourceDefendSigned(static_cast<uint32_t>(unit.valOfBonuses(others))),unit),state?(*state)[3]:0);
}
inline bool sourceDefendDisplayed(const battle::Unit & unit,bool nativeDefending)
{
 const auto state=sourceDefendState(unit);return state?((*state)[4]==0&&(*state)[5]==0):nativeDefending;
}
}
VCMI_LIB_NAMESPACE_END
