#pragma once
#include <cstdint>
namespace era_bridge
{
inline bool sourceThunderChance(int roll){return roll>=1 && roll<=20;}
//440F0E LEA(count,count,4), then SHL1: signed DWORD wrap, not spell power.
inline std::int64_t sourceThunderRawDamage(std::uint32_t count)
{
    const std::uint32_t raw=count*10u;
    return raw>=0x80000000u?std::int64_t(raw)-0x100000000LL:std::int64_t(raw);
}
}
