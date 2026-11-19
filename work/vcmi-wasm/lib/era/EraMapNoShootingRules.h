/* Source77 rule129, signed creature HP and cleared EA rows; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <cstring>
namespace era_bridge::map_rules
{
inline constexpr char noShootingBaseMarker[]="eraMap:noShootingBase:v1";
inline constexpr char noShootingExperienceMarker[]="eraMap:noShootingExperience:v1";
inline int32_t noShootingHealth(int32_t previous)
{
    const uint32_t bits=static_cast<uint32_t>(previous)*3u;
    int32_t product;
    std::memcpy(&product,&bits,sizeof(product));
    return product/2;
}
inline bool noShootingClearsExperienceRow(int ability,int modifier)
{
    return (ability==102&&(modifier==69||modifier==83||modifier==115))
        ||ability==79||ability==105||ability==111;
}
}
