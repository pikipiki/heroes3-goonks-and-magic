/* Original leave-creatures constraints, admitted numeric range; GPL-2.0-or-later. */
#pragma once
#include <array>
#include <algorithm>
#include <cstdint>
#include <cstdlib>
namespace era_campaign_deployment_rule
{
inline constexpr std::array<std::array<int,2>,8> directions={{{0,-1},{1,-1},{1,0},{1,1},{0,1},{-1,1},{-1,0},{-1,-1}}};
inline bool allowedCreature(int source,bool machine=false)
{return source>=0&&source!=159&&(source<160||source>=164)&&source!=340&&!machine;}
inline int maximum(std::int64_t stack,std::int64_t army,int source,bool machine=false)
{return allowedCreature(source,machine)&&stack>0&&army>1?static_cast<int>(std::min<std::int64_t>({stack,army-1,4095})):0;}
inline bool adjacent(int x,int y,int z,int tx,int ty,int tz)
{
 const auto dx=std::int64_t(x)-tx,dy=std::int64_t(y)-ty;
 return z==tz&&dx>=-1&&dx<=1&&dy>=-1&&dy<=1&&(dx!=0||dy!=0);
}
}
