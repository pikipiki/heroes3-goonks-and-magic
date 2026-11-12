/* Original TUM179/181 arithmetic, independent of Windows ERM execution. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <stdexcept>
namespace era_bridge
{
inline std::int64_t goldenGooseRawIncome(int ownedCopies,int equippedCopies,bool backpackOption)
{
    if(ownedCopies<0 || equippedCopies<0 || equippedCopies>ownedCopies)
        throw std::invalid_argument("ERA Goose copies require0<=equipped<=owned");
    return static_cast<std::int64_t>(backpackOption?ownedCopies:equippedCopies)*7000;
}
inline int reflectionResistanceAfterAura(int current,bool equipped)
{
    if(!equipped)return current;
    return static_cast<int>(std::clamp(static_cast<std::int64_t>(current)+20,
        static_cast<std::int64_t>(0),static_cast<std::int64_t>(100)));
}
}
