/* WoG source77 rule239: placement order and guardian schedule.
 * GPL-2.0-or-later. */
#pragma once
#include <array>
#include <optional>
namespace era_bridge::town_banners
{
// Each test is UN:E: false means accessible. Native adapters must supply a
// complete original access test and preserve centre, right, left ordering.
template<class Accessible>
std::optional<std::array<int,3>> placement(int townX,int townY,int level,int mapSize,Accessible accessible)
{
    if(townY>=mapSize)return std::nullopt;
    for(const int dx:{0,1,-1})
    {
        const std::array<int,3> candidate{{townX+dx,townY+1,level}};
        if(accessible(candidate))return candidate;
    }
    return std::nullopt;
}
// Original UN:T uses tier5 upgraded/base for easy/normal, tier6 upgraded for
// hard; difficulties3 and4 use the consecutive source creatures150..158.
struct Guardian {int tier;bool upgraded;int fixedSource;};
inline Guardian guardian(int faction,int difficulty)
{
    return difficulty>2?Guardian{0,false,150+faction}
        :Guardian{difficulty/2+5,(difficulty&1)==0,-1};
}
struct InitialGuard {int count;bool enabled;};
inline InitialGuard initialGuard(bool townOwned){return {1,!townOwned};}
inline bool grows(int day,int difficulty)
{
    if(day<=1||(day-1)%7!=0)return false;
    const int week=(day-1)/7%4+1;
    return week==1||(week==3&&(difficulty&1)==0);
}
inline bool eligibleForGrowth(int tileOwner,bool hasExtendedRecord)
{return tileOwner>-2&&hasExtendedRecord;}
}
