#pragma once
#include <array>
#include <algorithm>
#include <cstdint>

namespace era_bridge::map_rules
{
// HE:V0..9: the ten original adventure-object visitation categories.
inline constexpr std::array<int,10> monthlyVisitTypes{{100,23,32,51,61,102,41,4,47,107}};
inline constexpr bool monthlyVisitDay(int64_t day)
{return day>1&&(day-1)%28==0;}
inline bool monthlyVisitType(int type)
{return std::find(monthlyVisitTypes.begin(),monthlyVisitTypes.end(),type)!=monthlyVisitTypes.end();}
template<typename Visits,typename ObjectType>
void clearMonthlyVisits(Visits & visits,ObjectType objectType)
{
    for(auto it=visits.begin();it!=visits.end();)
        if(monthlyVisitType(objectType(*it)))it=visits.erase(it);
        else ++it;
}
}
