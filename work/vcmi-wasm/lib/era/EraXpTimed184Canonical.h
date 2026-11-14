#pragma once
#include "EraXpTimed184State.h"
#include "../spells/CSpellHandler.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
// Evidence is supplied at the original core/innate APPLICATION event, never
// inferred from BonusSource::SPELL_EFFECT, a shared spell ID or a DEFEND tag.
struct XpTimed184OriginalApplication
{
 bool originalProviderObserved=false;
 int mastery=-1,remainingDuration=0;std::optional<int> nativeDuration;
 // Required for Disease: capture these before the ORIGINAL application. Reading
 // displayed ATK/DEF after expiration of Prayer/Frenzy cannot reconstruct them.
 std::optional<int> rawAttackBefore,rawDefenseBefore;
};
inline bool sameXpTimed184NativeBonus(const Bonus&a,const Bonus&b)
{
 return a.type==b.type&&a.subtype==b.subtype&&a.source==b.source&&a.sid==b.sid
  &&a.val==b.val&&a.valType==b.valType&&a.effectRange==b.effectRange
  &&a.duration==b.duration&&a.turnsRemain==b.turnsRemain&&a.stacking==b.stacking
  &&!a.parameters&&!b.parameters&&!a.limiter&&!b.limiter&&!a.updater&&!b.updater;
}
inline std::optional<era_bridge::xp184::State> canonicalXpTimed184State(int spell,
 const std::vector<Bonus>&native,const XpTimed184OriginalApplication&evidence,bool siege)
{
 if(!evidence.originalProviderObserved||evidence.mastery<0||evidence.mastery>3||evidence.remainingDuration<=0||!era_bridge::xp184::supports(spell))return std::nullopt;
 std::vector<Bonus> expected;SpellID(spell).toSpell()->getEffects(expected,evidence.mastery,false,evidence.nativeDuration.value_or(evidence.remainingDuration));
 const size_t wanted=(spell==62?(evidence.mastery==3?3:2):(spell==70||spell==74?3:(spell==73?2:1)));
 if(native.size()!=expected.size()||expected.size()!=wanted)return std::nullopt;
 std::vector<bool> used(native.size(),false);
 for(const auto&e:expected)
 {
  auto found=native.size();for(size_t i=0;i<native.size();++i)if(!used[i]&&sameXpTimed184NativeBonus(e,native[i])){found=i;break;}
  if(found==native.size())return std::nullopt;used[found]=true;
 }
 // Exact original roles: a changed core descriptor is not a source primitive.
 for(const auto&b:expected)
 {
  bool allowed=false;
  switch(spell)
  {
   case 42:allowed=b.type==BonusType::ALWAYS_MINIMUM_DAMAGE&&b.val==(evidence.mastery>=2?1:0)&&b.valType==BonusValueType::INDEPENDENT_MAX;break;
   case 49:case 50:case 51:case 52:allowed=b.type==(spell<=50?BonusType::MORALE:BonusType::LUCK)&&b.val==((spell==50||spell==52)?-1:1)*(evidence.mastery>=2?2:1)&&b.valType==BonusValueType::ADDITIVE_VALUE;break;
   case 54:allowed=b.type==BonusType::STACKS_SPEED&&b.val==(evidence.mastery>=2?-50:-25)&&b.valType==BonusValueType::PERCENT_TO_ALL;break;
   case 59:allowed=b.type==BonusType::ATTACKS_NEAREST_CREATURE;break;
   case 60:allowed=b.type==BonusType::HYPNOTIZED&&b.val==evidence.mastery;break;
   case 61:allowed=b.type==BonusType::FORGETFULL&&b.val==evidence.mastery&&b.valType==BonusValueType::ADDITIVE_VALUE;break;
   case 62:allowed=(b.type==BonusType::NOT_ACTIVE&&b.val==0)||(b.type==BonusType::NO_RETALIATION&&b.val==0&&evidence.mastery==3)||(b.type==BonusType::GENERAL_ATTACK_REDUCTION&&(b.val==0||b.val==25||b.val==50||b.val==75||b.val==100));break;
   case 70:allowed=(b.type==BonusType::NOT_ACTIVE&&b.val==0)||(b.type==BonusType::NO_RETALIATION&&b.val==0)||(b.type==BonusType::GENERAL_DAMAGE_REDUCTION&&b.val==50);break;
   case 74:allowed=(b.type==BonusType::NOT_ACTIVE&&b.val==0)||(b.type==BonusType::NO_RETALIATION&&b.val==0)||(b.type==BonusType::GENERAL_ATTACK_REDUCTION&&b.val==75);break;
   case 73:allowed=b.type==BonusType::PRIMARY_SKILL&&b.val==-2&&(b.subtype==BonusSubtypeID(PrimarySkill::ATTACK)||b.subtype==BonusSubtypeID(PrimarySkill::DEFENSE));break;
  }
  if(!allowed||b.effectRange!=BonusLimitEffect::NO_LIMIT)return std::nullopt;
  if(b.type==BonusType::NOT_ACTIVE&&b.subtype!=BonusSubtypeID(SpellID(spell)))return std::nullopt;
 }
 if(spell==73&&(!evidence.rawAttackBefore||!evidence.rawDefenseBefore))return std::nullopt;
 era_bridge::xp184::State empty;
 return era_bridge::xp184::cast(empty,spell,evidence.remainingDuration,evidence.mastery,
  evidence.rawAttackBefore.value_or(0),evidence.rawDefenseBefore.value_or(0),siege).state;
}
}
VCMI_LIB_NAMESPACE_END
