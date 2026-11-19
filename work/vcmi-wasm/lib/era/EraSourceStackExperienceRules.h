/* Signed source stack-experience records; GPL-2.0-or-later. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <cstring>
#include <stdexcept>
namespace era_bridge::stack_experience
{
inline int32_t signedWord(uint32_t bits)
{
    int32_t value;
    std::memcpy(&value,&bits,sizeof(value));
    return value;
}
inline int32_t retainedUpgradeExperience(int32_t average,float coefficient)
{
    // The admitted CREXPMOD profiles use this exactly representable float32
    // coefficient. Signed conversion truncates toward zero, including negatives.
    if(coefficient!=0.75f)throw std::runtime_error("Unadmitted signed upgrade coefficient");
    return static_cast<int32_t>(static_cast<double>(average)*coefficient);
}
inline int32_t weightedTotal(int64_t total,int32_t count,int32_t maximum)
{
    if(count<=0)return 0;
    const auto word=signedWord(static_cast<uint32_t>(total));
    return std::min(static_cast<int32_t>(static_cast<int64_t>(word)/count),maximum);
}
inline int32_t merge(int64_t currentTotal,int64_t incomingTotal,int32_t count,int32_t maximum)
{
    const uint32_t sum=static_cast<uint32_t>(currentTotal)+static_cast<uint32_t>(incomingTotal);
    return weightedTotal(signedWord(sum),count,maximum);
}
inline int32_t transform(int32_t experience,int32_t count,int32_t oldMaximum,int32_t newMaximum)
{
    const auto old=std::min(experience,oldMaximum);
    const auto product=static_cast<uint32_t>(old)*static_cast<uint32_t>(count);
    return weightedTotal(signedWord(product),count,newMaximum);
}
}
