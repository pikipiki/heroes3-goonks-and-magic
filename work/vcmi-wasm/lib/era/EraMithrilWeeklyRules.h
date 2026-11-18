/* WoG script42 source171 weekly schedule. GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <tuple>
namespace era_bridge::mithril
{
inline bool weeklyDue(int day,int previousDay,bool enabled)
{return enabled&&day>=1&&(day-1)%7==0&&previousDay!=day;}
inline bool weeklyMithril(int draw){return draw==12;}
struct SourceSitePosition{int x,y,z,id;};
inline bool sourceSiteLess(const SourceSitePosition & a,const SourceSitePosition & b)
{
    // UN:U's documented diagonal scan: (0,0),(1,0),(0,1),(2,0),...
    return std::tuple(a.z,a.x+a.y,a.y,a.id)<std::tuple(b.z,b.x+b.y,b.y,b.id);
}
inline std::int32_t doubleWeeklyStock(std::int32_t value)
{
    const auto bits=static_cast<std::uint32_t>(value)*2u;
    return bits<=0x7fffffffU?static_cast<std::int32_t>(bits)
        :static_cast<std::int32_t>(std::int64_t(bits)-0x100000000LL);
}
}
