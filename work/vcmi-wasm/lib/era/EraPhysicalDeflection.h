/* Source-reference WoG71C710 partial physical block; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <algorithm>
namespace era_bridge
{
struct PhysicalDeflection
{
    int strength;
    int chance;
    // The executable uses MOVSX, not MOVZX. Preserve values >=128 as negative.
    static constexpr PhysicalDeflection decode(int modifier, int rankValue)
    {
        const int signedByte = modifier >= 128 ? modifier - 256 : modifier;
        return signedByte >= 100 ? PhysicalDeflection{rankValue, signedByte - 100}
            : PhysicalDeflection{signedByte + 1, rankValue};
    }
    constexpr bool needsRoll() const { return chance > 0; }
    constexpr bool succeeds(int oneToHundred) const { return oneToHundred >= 1 && oneToHundred <= chance; }
    template<class Notify>
    int64_t apply(int64_t damage,bool success,Notify && notify) const
    {
        if(!success || strength<1)return damage;
        //71C8BB..71C902 logs before damage reduction. L200 signed strength<1
        //still consumes its source draw but never emits a notification.
        notify(strength,chance);
        return damage*(100-std::min(strength,100))/100;
    }
    int64_t apply(int64_t damage, bool success) const
    {
        //71C88C returns unchanged even after a successful RNG draw when strength<1.
        return apply(damage,success,[](int,int){});
    }
};
}
