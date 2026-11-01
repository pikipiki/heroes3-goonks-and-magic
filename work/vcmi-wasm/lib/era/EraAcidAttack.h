/* Independent semantic adapter for ATT_DISRUPT original4411BF. GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <limits>
#include <stdexcept>
namespace era_bridge
{
struct AcidAttack
{
    static constexpr bool succeeds(int roll) { return roll >= 1 && roll <= 20; }
    static int64_t damage(int perCreature, int64_t alive)
    {
        if(perCreature < 0 || alive < 0 || alive > std::numeric_limits<int32_t>::max())
            throw std::runtime_error("ERA acid attack: source signed32 damage domain exceeded");
        // x86 IMUL retains the signed low32 bits, then CDQ/SUB/SAR divides
        // toward zero. Keep that behavior without signed C++ overflow.
        const uint32_t bits=static_cast<uint32_t>(static_cast<uint64_t>(perCreature)*alive);
        const int64_t product=bits<=0x7fffffffU ? bits : static_cast<int64_t>(bits)-0x100000000LL;
        return product/2;
    }
};
}
