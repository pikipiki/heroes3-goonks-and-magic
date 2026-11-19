/* Source77 rule113 signed price transitions; GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <cstring>

namespace era_bridge::creature_prices
{
inline int32_t signedWord(uint32_t bits)
{
    int32_t result;
    std::memcpy(&result,&bits,sizeof(result));
    return result;
}
inline int32_t half(int32_t price)
{
    // Original MA:C d>>1 uses SHR32, including negative stored words.
    return signedWord(static_cast<uint32_t>(price)>>1);
}
inline int32_t restore(int32_t price)
{
    auto result=signedWord(static_cast<uint32_t>(price)*2u);
    // Original restoration is deliberately not a remembered base price.
    if(result%10==4)result=signedWord(static_cast<uint32_t>(result)+1u);
    return result;
}
inline int32_t fortGold(int32_t total, int percent)
{
    // Original Hill Fort multiplies the stack total, with single-precision
    // conversion and truncation; an unrepresentable FISTP yields INT_MIN.
    const float amount = static_cast<float>(total);
    const float coefficient = static_cast<float>(percent) / 100.0f;
    const float discounted = amount * coefficient;
    if(!(discounted >= -2147483648.0f && discounted < 2147483648.0f))
        return signedWord(0x80000000u);
    return static_cast<int32_t>(discounted);
}
inline bool wantsHalf(int day,bool human,int weekday)
{
    return day>1&&(!human||weekday==7);
}
inline bool affectedSourceCreature(int source)
{
    return source>=0&&(source<145||source>149);
}
}
