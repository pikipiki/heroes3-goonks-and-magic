/* Exact lower-building bits from the original CA:B2 table. */
#pragma once
#include <cstdint>
namespace era_campaign_town
{
inline constexpr std::uint16_t recruitWord(int value){return static_cast<std::uint16_t>(value);}
inline constexpr int recruitQuery(std::uint32_t value){const auto word=static_cast<std::uint16_t>(value);return word<32768?word:static_cast<int>(word)-65536;}
inline constexpr int lowerBuilding(int building)
{
 if(building>=1&&building<=4)return building-1;
 if(building==8||building==9||building==11||building==12||building==13)return building-1;
 if(building>=37&&building<=43)return building-7;
 return -1;
}
}
