/* TUM Horn266 source1482..1640; GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <array>
#include <cstdint>
namespace era_bridge
{
inline int32_t hornSigned32(uint32_t value)
{
    return value<0x80000000u?static_cast<int32_t>(value):static_cast<int32_t>(int64_t(value)-0x100000000LL);
}
inline int32_t horn266Count(int32_t originalCount,int32_t currentCount,int32_t targetHp,
    int32_t fangarmHp,bool living,bool isFangarm,int sideCount,bool equipped)
{
    if(!equipped || !living || isFangarm || originalCount<=0 || currentCount>0 || sideCount>20 || fangarmHp<=0)return 0;
    const auto product=hornSigned32(uint32_t(originalCount)*uint32_t(targetHp));
    return std::max<int32_t>(0,std::min<int32_t>(product/fangarmHp,originalCount/2));
}
inline int32_t horn266GainAdd(int32_t accumulated,int32_t currentCount,int32_t originalCount)
{
    const auto delta=hornSigned32(uint32_t(currentCount)-uint32_t(originalCount));
    return delta>0?hornSigned32(uint32_t(accumulated)+uint32_t(delta)):accumulated;
}
inline int horn266ArmySlot(const std::array<int,7> & ids)
{
    for(int i=0;i<7;++i)if(ids[i]==263)return i;
    for(int i=0;i<7;++i)if(ids[i]<0)return i;
    return -1;
}
}
