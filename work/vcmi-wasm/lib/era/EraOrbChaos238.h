/* MR0 VRdamage:*3 :2, explicit Win32-width arithmetic without signed UB. */
#pragma once
#include <cstdint>
#include <cstddef>
namespace era_bridge
{
inline constexpr int64_t sourceChainRawDamage(int64_t damage,std::size_t targetIndex)
{
    const uint32_t bits=static_cast<uint32_t>(damage);
    int64_t value=bits<=uint32_t{0x7fffffff}?static_cast<int64_t>(bits)
        :static_cast<int64_t>(bits)-int64_t{0x100000000};
    while(targetIndex-- && value)value/=2; // Original5A68C3..CB, toward zero.
    return value;
}
inline constexpr int64_t sourceOrbChaosDamage(int64_t damage)
{
    const uint32_t product=static_cast<uint32_t>(damage)*uint32_t{3};
    const int64_t signedProduct=product<=uint32_t{0x7fffffff}
        ? static_cast<int64_t>(product) : static_cast<int64_t>(product)-int64_t{0x100000000};
    return signedProduct/2;
}
}
