#pragma once
#include <cstdint>
#include <array>

namespace era_bridge::tile_properties
{
// PO:N stores bits12..15 after the ordinary signed Win32 VR operation.
inline int number(std::int32_t value)
{
    return static_cast<std::uint32_t>(value)&15U;
}
inline std::array<int,3> coordinates(std::int32_t x,std::int32_t y,std::int32_t z)
{
    const auto packed=(static_cast<std::uint32_t>(y)<<16)
        +static_cast<std::uint32_t>(x)+(z!=0?0x04000000U:0U);
    return {static_cast<int>(packed&1023U),static_cast<int>((packed>>16)&1023U),
        packed>=0x04000000U?1:0};
}
}
