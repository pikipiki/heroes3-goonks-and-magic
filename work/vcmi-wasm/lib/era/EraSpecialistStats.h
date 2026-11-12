#pragma once
#include <algorithm>
#include <cstdint>
#include <limits>
#include <stdexcept>
namespace era_bridge
{
struct SpecialistStats { int attackDefense; int damage; int healthPercent; };
inline SpecialistStats sourceSpecialistStats(int level,int tier)
{
    if(tier<1 || tier>7)throw std::invalid_argument("Source specialist tier outside 1..7");
    static constexpr int divider[]={16,15,13,12,10,7,5};
    const int safeLevel=std::clamp(level,1,std::numeric_limits<int>::max()-9);
    return {safeLevel/7+1,safeLevel/divider[tier-1],safeLevel+9};
}
inline int sourceSpecialistHealth(int health,int percentage)
{
    return static_cast<int>(std::clamp<int64_t>(static_cast<int64_t>(health)
        + static_cast<int64_t>(health)*percentage/100,1,std::numeric_limits<int>::max()));
}
}
