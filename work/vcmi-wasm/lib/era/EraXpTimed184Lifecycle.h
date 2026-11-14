#pragma once
#include "EraXpTimed184State.h"
#include "../CStack.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline void replaceXpTimed184Local(CStack&unit,int spell,const era_bridge::xp184::State&state)
{
 if(!unit.getLocalBonus(CSelector([spell](const Bonus*b){return b->stacking==xpTimed184Tag(spell)+"state";})))throw std::runtime_error("Inherited source timed184 marker needs clone reconciliation");
 unit.removeBonuses(CSelector([spell](const Bonus*b){return xpTimed184Owned(*b,spell);}));
 for(const auto&b:xpTimed184Projection(state))unit.addNewBonus(std::make_shared<Bonus>(b));
}
inline void advanceXpTimed184Local(CStack&unit,bool tactics)
{
 for(int spell:{42,49,50,51,52,54,59,60,61,62,70,73,74})
 {
  const auto old=readXpTimed184(unit,spell);if(!old.owned)continue;
  const auto change=era_bridge::xp184::round(old.state,unit.alive(),tactics);
  if(change.removed||change.state.duration!=old.state.duration)replaceXpTimed184Local(unit,spell,change.state);
 }
}
inline void wakeXpTimed184Local(CStack&unit)
{
 for(int spell:{62,70,74}){const auto old=readXpTimed184(unit,spell);if(old.owned&&old.state.removable())replaceXpTimed184Local(unit,spell,era_bridge::xp184::remove(old.state).state);}
}
inline void clearXpTimed184OnDeath(CStack&unit)
{
 //443E40 removes positive durations only; persistent zero/negative debts survive.
 for(int spell:{42,49,50,51,52,54,59,60,61,62,70,73,74}){const auto old=readXpTimed184(unit,spell);if(old.owned&&old.state.removable())replaceXpTimed184Local(unit,spell,era_bridge::xp184::remove(old.state).state);}
}
inline std::optional<SetStackEffect> removeXpTimed184Packet(BattleID battleID,const battle::Unit&unit,int spell)
{
 const auto old=readXpTimed184(unit,spell);if(!old.owned||!old.state.removable())return std::nullopt;
 return xpTimed184Packet(battleID,unit,old,era_bridge::xp184::remove(old.state).state);
}
inline std::optional<int> sourceXpTimed184Speed(const battle::Unit&unit,int rawC4,int turn=0)
{
 const auto old=readXpTimed184(unit,54);if(!old.owned)return std::nullopt;
 if(old.state.duration>0&&turn>=old.state.duration)return rawC4;
 return era_bridge::xp184::speed(rawC4,old.state,unit.hasBonusOfType(BonusType::SIEGE_WEAPON));
}
inline std::optional<int> sourceXpTimed184Initiative(const battle::Unit&unit,int turn)
{
 const auto old=readXpTimed184(unit,54);if(!old.owned||!old.state.active())return std::nullopt;
 const auto others=Selector::type()(BonusType::STACKS_SPEED).And(Selector::turns(turn))
  .And([](const Bonus*b){return !xpTimed184Owned(*b,54);});
 const int raw=era_bridge::xp184::signed32(static_cast<uint32_t>(unit.valOfBonuses(others)));
 return sourceXpTimed184Speed(unit,raw,turn);
}
}
VCMI_LIB_NAMESPACE_END
