/* Original UN:K/M map-local calendar policy. GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <stdexcept>
namespace era_campaign_calendar
{
struct Settings
{
 std::int32_t week=0,message=0,month=0,creature=0;
};
enum class Effect { Inherit, Normal, DoubleGrowth, Plague };
inline void validate(const Settings & value)
{
 if(value.week<0||value.week>1||value.message<0||value.message>500||value.month<0||value.month>3||value.creature<0)
  throw std::runtime_error("Invalid source campaign calendar settings");
}
inline Effect effect(const Settings & value,bool newMonth)
{
 validate(value);
 if(newMonth){if(value.month==1)return Effect::Normal;if(value.month==2)return Effect::DoubleGrowth;if(value.month==3)return Effect::Plague;}
 else if(value.week==1)return Effect::Normal;
 return Effect::Inherit;
}
}
