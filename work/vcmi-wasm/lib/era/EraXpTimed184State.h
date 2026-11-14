#pragma once
#include "EraXpTimed184Rule.h"
#include "../battle/Unit.h"
#include "../bonuses/BonusList.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/BonusSelector.h"
#include "../networkPacks/SetStackEffect.h"
#include <string>
#include <string_view>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline constexpr int xpTimed184Signature=0x5850544d;
inline std::string xpTimed184Tag(int spell){return "eraSourceXpTimed184:"+std::to_string(spell)+":";}
inline constexpr std::string_view xpTimed184Prefix="eraSourceXpTimed184:";
inline bool sourceTimedOwnedTag(std::string_view tag){return tag.substr(0,xpTimed184Prefix.size())==xpTimed184Prefix;}
inline bool xpTimed184Owned(const Bonus & b,int spell){const auto tag=xpTimed184Tag(spell);return b.stacking.compare(0,tag.size(),tag)==0;}
inline std::vector<Bonus> xpTimed184Projection(const era_bridge::xp184::State&);
struct XpTimed184Snapshot{era_bridge::xp184::State state;bool owned=false,foreign=false;std::vector<Bonus> bonuses,foreignBonuses;};
inline XpTimed184Snapshot readXpTimed184(const battle::Unit &target,int spell)
{
 if(!era_bridge::xp184::supports(spell))throw std::runtime_error("Unsupported source timed184 spell");
 XpTimed184Snapshot result;result.state.spell=spell;int markers=0;
 const auto sourceBonusList24=target.getBonuses([](const Bonus*){return true;});
 for(const auto &b:*sourceBonusList24)
 {
  if(xpTimed184Owned(*b,spell))
  {
   result.bonuses.push_back(*b);
   if(b->stacking==xpTimed184Tag(spell)+"state")
   {
    if(++markers!=1||!b->parameters||b->source!=BonusSource::OTHER||b->val!=0||b->duration!=BonusDuration::PERMANENT||b->type!=BonusType::PRIMARY_SKILL||b->subtype!=BonusSubtypeID(PrimarySkill::ATTACK))throw std::runtime_error("Malformed source timed184 marker");
    const auto p=b->parameters->toVector();
    if(p.size()!=11||p[0]!=xpTimed184Signature||p[1]!=1||p[2]!=spell||p[4]<0||p[4]>3)throw std::runtime_error("Malformed source timed184 state payload");
    result.state={p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],static_cast<std::uint32_t>(p[10])};result.owned=true;
   }
  }
  else if(b->source==BonusSource::SPELL_EFFECT&&b->sid==BonusSourceID(SpellID(spell))){result.foreign=true;result.foreignBonuses.push_back(*b);}
 }
 if(!result.owned&&!result.bonuses.empty())throw std::runtime_error("Source timed184 projections missing state");
 if(result.owned)
 {
  const auto expected=xpTimed184Projection(result.state);
  if(expected.size()!=result.bonuses.size())throw std::runtime_error("Incomplete source timed184 projections");
  for(const auto&e:expected)
  {
   const auto found=std::find_if(result.bonuses.begin(),result.bonuses.end(),[&](const Bonus&b)
    {const std::vector<int32_t> empty;return e.stacking==b.stacking&&e.type==b.type&&e.subtype==b.subtype&&e.source==b.source&&e.sid==b.sid&&e.val==b.val&&e.valType==b.valType&&e.effectRange==b.effectRange&&e.duration==b.duration&&e.turnsRemain==b.turnsRemain&&(e.parameters?e.parameters->toVector():empty)==(b.parameters?b.parameters->toVector():empty);});
   if(found==result.bonuses.end())throw std::runtime_error("Changed source timed184 projection identity");
  }
 }
 return result;
}
inline Bonus xpTimed184Bonus(const era_bridge::xp184::State&s,BonusType type,int value,const std::string&suffix)
{
 Bonus b;b.type=type;b.val=value;b.duration=BonusDuration::PERMANENT;b.source=BonusSource::SPELL_EFFECT;b.sid=BonusSourceID(SpellID(s.spell));b.turnsRemain=s.duration;b.stacking=xpTimed184Tag(s.spell)+suffix;return b;
}
inline std::vector<Bonus> xpTimed184Projection(const era_bridge::xp184::State&s)
{
 using namespace era_bridge::xp184;
 Bonus marker=xpTimed184Bonus(s,BonusType::PRIMARY_SKILL,0,"state");marker.subtype=BonusSubtypeID(PrimarySkill::ATTACK);marker.source=BonusSource::OTHER;marker.hidden=true;
 marker.parameters=std::make_shared<BonusParameters>(std::vector<int32_t>{xpTimed184Signature,1,s.spell,s.duration,s.mastery,s.magnitude,s.activeAttackLoss,s.activeDefenseLoss,s.persistentAttackLoss,s.persistentDefenseLoss,signed32(s.generation)});
 std::vector<Bonus> result{marker};
 if(s.active())switch(s.spell)
 {
  case 42:{auto b=xpTimed184Bonus(s,BonusType::ALWAYS_MINIMUM_DAMAGE,s.magnitude,"effect");b.valType=BonusValueType::INDEPENDENT_MAX;result.push_back(b);break;}
  case 49:case 50:case 51:case 52:result.push_back(xpTimed184Bonus(s,s.spell<=50?BonusType::MORALE:BonusType::LUCK,(s.spell==50||s.spell==52)?-s.magnitude:s.magnitude,"effect"));break;
  case 54:{if(s.magnitude==0){auto b=xpTimed184Bonus(s,BonusType::PRIMARY_SKILL,0,"effect");b.subtype=BonusSubtypeID(PrimarySkill::ATTACK);result.push_back(b);break;}auto b=xpTimed184Bonus(s,BonusType::STACKS_SPEED,s.magnitude-100,"effect");b.valType=BonusValueType::PERCENT_TO_ALL;result.push_back(b);break;}
  case 59:result.push_back(xpTimed184Bonus(s,BonusType::ATTACKS_NEAREST_CREATURE,0,"effect"));break;
  case 60:result.push_back(xpTimed184Bonus(s,BonusType::HYPNOTIZED,s.mastery,"effect"));break;
  case 61:{if(s.duration>0||s.magnitude>=2)result.push_back(xpTimed184Bonus(s,BonusType::FORGETFULL,s.magnitude,"effect"));
   else{auto b=xpTimed184Bonus(s,BonusType::PRIMARY_SKILL,0,"effect");b.subtype=BonusSubtypeID(PrimarySkill::ATTACK);result.push_back(b);}break;}
  case 62:case 70:case 74:{auto b=xpTimed184Bonus(s,BonusType::NOT_ACTIVE,0,"effect");b.subtype=BonusSubtypeID(SpellID(s.spell));result.push_back(b);if(s.spell==70)result.push_back(xpTimed184Bonus(s,BonusType::GENERAL_DAMAGE_REDUCTION,50,"stoneDamage"));break;}
  case 73:{auto b=xpTimed184Bonus(s,BonusType::PRIMARY_SKILL,0,"effect");b.subtype=BonusSubtypeID(PrimarySkill::ATTACK);result.push_back(b);break;}
  default:break;
 }
 // Disease loss is deliberately OTHER, immune to generic counter/removal. The
 // typed lifecycle restores only active loss; getters project after percentages.
 for(auto item:{std::pair{PrimarySkill::ATTACK,s.attackLoss()},std::pair{PrimarySkill::DEFENSE,s.defenseLoss()}})
  if(item.second!=0){auto b=xpTimed184Bonus(s,BonusType::PRIMARY_SKILL,sub(0,item.second),item.first==PrimarySkill::ATTACK?"lossA":"lossD");b.source=BonusSource::OTHER;b.subtype=BonusSubtypeID(item.first);b.hidden=true;result.push_back(b);}
 return result;
}
inline SetStackEffect xpTimed184Packet(BattleID id,const battle::Unit&target,const XpTimed184Snapshot&old,const era_bridge::xp184::State&state)
{
 SetStackEffect p;p.battleID=id;if(!old.bonuses.empty())p.toRemove.emplace_back(target.unitId(),old.bonuses);p.toAdd.emplace_back(target.unitId(),xpTimed184Projection(state));return p;
}
inline std::optional<bool> xpTimed184RemovalIdentity(const Bonus&r,const Bonus&c)
{
 const auto owned=[](const Bonus&b){return sourceTimedOwnedTag(b.stacking);};
 if(!owned(r)&&!owned(c))return std::nullopt;
 const std::vector<int32_t> empty;
 return r.stacking==c.stacking&&r.turnsRemain==c.turnsRemain&&r.val==c.val
  &&(r.parameters?r.parameters->toVector():empty)==(c.parameters?c.parameters->toVector():empty);
}
inline int sourceTimedAttackLoss(const battle::Unit&unit){return readXpTimed184(unit,73).state.attackLoss();}
inline int sourceTimedDefenseLoss(const battle::Unit&unit){return readXpTimed184(unit,73).state.defenseLoss();}
inline bool sourceTimedStatActive(const battle::Unit&unit){const auto s=readXpTimed184(unit,73);return s.owned&&(s.state.active()||s.state.attackLoss()!=0||s.state.defenseLoss()!=0);}
inline bool xpTimed184StatProjection(const Bonus*b){return xpTimed184Owned(*b,73);}
// For unified45+73 getters: exclude both owned modules from native valOfBonuses,
// then subtract each independently. These functions never call getAttack/Defense.
inline int xpTimed184AttackAfterNative(int nativeWithoutDisease,const battle::Unit&unit)
{return era_bridge::xp184::sub(nativeWithoutDisease,sourceTimedAttackLoss(unit));}
inline int xpTimed184DefenseAfterNative(int nativeWithoutDisease,const battle::Unit&unit)
{return era_bridge::xp184::sub(nativeWithoutDisease,sourceTimedDefenseLoss(unit));}
}
VCMI_LIB_NAMESPACE_END
