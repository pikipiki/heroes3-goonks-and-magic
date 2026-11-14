/* OB:S/R/D/E disable native object effects while retaining script visits. */
#pragma once
#include <cstdint>
#include <stdexcept>
namespace era_campaign_object_access
{
inline std::uint8_t change(std::uint8_t mask,char operation,int player=0)
{
 if(operation=='S')return 0;
 if(operation=='R')return 255;
 if(player<0||player>=8)throw std::runtime_error("Invalid campaign object player");
 if(operation=='D')return mask&~(1u<<player);
 if(operation=='E')return mask|(1u<<player);
 throw std::runtime_error("Invalid campaign object access operation");
}
inline bool allows(std::uint8_t mask,int player)
{return player>=0&&player<8&&(mask&(1u<<player));}
}
