/* Original vulnerability_125: CDQ;SUB EAX,EDX;SAR EAX,2;NEG EAX. */
#pragma once
#include <cstdint>
namespace era_bridge
{
constexpr std::int64_t sourceQuarterSpellDamage(std::int64_t incoming)
{
    const auto shifted=incoming+(incoming<0?1:0);
    auto quarter=shifted/4;
    if(shifted<0 && shifted%4)--quarter; // Defined arithmetic-shift rounding.
    return -quarter;
}
}
