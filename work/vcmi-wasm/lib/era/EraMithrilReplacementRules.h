/* Source42 / WoG170 first-map resource replacement. GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <optional>
#include <tuple>
namespace era_bridge::mithril
{
inline std::optional<int> replacementAmount(int sourceResource,std::uint32_t nativeAmount)
{
    if(sourceResource<0||sourceResource>7)return std::nullopt;
    if(sourceResource==6)
    {
        // AR:V reads packed counter units; pickup multiplies gold by100.
        // Fractional native extensions have no original packed equivalent.
        if(nativeAmount%100)return std::nullopt;
        nativeAmount/=100;
    }
    if(nativeAmount<2||nativeAmount>9)return std::nullopt;
    return sourceResource==0||sourceResource==2||sourceResource==6
        ?static_cast<int>(nativeAmount/2+1):static_cast<int>(nativeAmount);
}
inline std::int32_t replacementCounter(std::int32_t previous,bool placed,int draw)
{
    if(placed)return draw;
    const auto bits=static_cast<std::uint32_t>(previous)-1u;
    return bits<=0x7fffffffU?static_cast<std::int32_t>(bits)
        :static_cast<std::int32_t>(std::int64_t(bits)-0x100000000LL);
}
struct ReplacementSitePosition{int x,y,z,id;};
inline bool replacementSiteLess(const ReplacementSitePosition & a,const ReplacementSitePosition & b)
{return std::tuple(a.z,a.y,a.x,a.id)<std::tuple(b.z,b.y,b.x,b.id);}
}
