/* WoG 3.58f TM table: four zero-extended 16-bit words, IDs 1..100. */
#pragma once
#include <array>
#include <cstdint>
#include <stdexcept>
namespace era_campaign_timers
{
using Settings=std::array<std::uint16_t,4>;
inline std::uint16_t word(std::int32_t value){return static_cast<std::uint32_t>(value)&0xffffu;}
inline bool due(const Settings & timer,std::int32_t day,int player)
{
 if(player<0||player>=8)throw std::runtime_error("Invalid campaign timer player");
 if(!(timer[3]&(1u<<player))||day<timer[0]||day>timer[1])return false;
 // The original idiv traps on zero. Reject the invalid setting explicitly.
 if(!timer[2])throw std::runtime_error("Campaign timer has zero interval");
 return (day-timer[0])%timer[2]==0;
}
inline void access(Settings & timer,bool enable,int player)
{
 if(player<0||player>=8)throw std::runtime_error("Invalid campaign timer player");
 timer[3]=enable?timer[3]|(1u<<player):timer[3]&~(1u<<player);
}
}
