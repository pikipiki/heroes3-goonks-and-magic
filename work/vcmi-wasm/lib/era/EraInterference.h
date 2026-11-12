/* TUM269..271 cached battle power, source integer arithmetic. */
#pragma once
#include <algorithm>
#include <cstdint>
namespace era_bridge
{
inline int interferencePower(int power,bool charm,bool seal,bool plate)
{
    const int reduction=std::clamp((charm?10:0)+(seal?10:0)+(plate?25:0),0,100);
    return reduction?int(std::max<int64_t>(1,int64_t(100-reduction)*power/100)):power;
}
}
