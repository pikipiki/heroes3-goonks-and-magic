/* Original4E62FD specialty in source263 K60 reception; GPL-2.0-or-later. */
#pragma once
#include "EraHorn266.h"
#include <cstdint>
namespace era_bridge
{
inline int32_t fangarmAstralHypnotizeThreshold(int32_t raw,uint32_t heroLevel,int32_t targetLevel)
{
    // Target levels below1 cannot reach the original living Hypnotize path.
    // Keep custom native level0 targets stable instead of dividing by zero.
    if(targetLevel<=0)return raw;
    const uint32_t low=heroLevel&0xffffu;
    const int32_t signedLevel=low<0x8000u?int32_t(low):int32_t(low)-65536;
    const int32_t quotient=signedLevel/targetLevel;
    const int32_t product=hornSigned32(uint32_t(quotient)*uint32_t(raw));
    // 63AC08 is binary64 .03.4E6323 FSTP QWORD stores the FMUL result
    // to the stack BEFORE619297 sets x87 CW1B3F/FRNDINT (ceil); the
    // original extended80 intermediate is not passed directly to CEIL.
    // For any signed32 integer product, ceil(product*.03) equals ceil(3*p/100):
    // nonintegral rational results are >=.01 from an integer; at multiples100
    // the binary64 product rounds to that exact integer. Integer evaluation
    // also preserves the source behavior at negative IMUL32 results.
    const int64_t scaled=int64_t(product)*3;
    const int32_t gain=int32_t(scaled/100+(scaled>0 && scaled%100!=0?1:0));
    return hornSigned32(uint32_t(raw)+uint32_t(gain));
}
}
