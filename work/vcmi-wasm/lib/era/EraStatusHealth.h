/* Source444C3E/444CDE/446F11, exact IEEE32 constants without host float dependence. */
#pragma once
#include <algorithm>
#include <cstdint>
namespace era_bridge
{
inline bool sourcePoisonPercentSupported(int value)
{
    return value>=0 && value<=50 && value%10==0;
}
inline uint64_t sourceHealthFloatInteger(int value)
{
    // FILD baseHP is stored by FSTPS before multiplication. Reproduce the
    // nearest-even float32 integer, including HP above2^24, without host FPU.
    uint64_t n=static_cast<uint32_t>(value),mantissa=n;
    int shift=0;while(mantissa>0xffffff){mantissa>>=1;++shift;}
    if(!shift)return n;
    const uint64_t remainder=n&((uint64_t(1)<<shift)-1),half=uint64_t(1)<<(shift-1);
    if(remainder>half || (remainder==half && (mantissa&1)))++mantissa;
    return mantissa<<shift;
}
inline uint32_t sourceStatusMaxHealth(int baseline, int poisonPercent, bool age)
{
    // Zero is a sentinel for the caller's native fallback, never a combat throw.
    if(baseline<1 || !sourcePoisonPercentSupported(poisonPercent))return 0;
    // FPU subtracts float0.1 then stores float32 at+4A4 each tick.
    // In [0.5,1), each subtraction rounds coefficient down by1677722/2^24.
    const int64_t coefficient=std::max<int64_t>(0x800000,0x1000000LL-1677722LL*(poisonPercent/10));
    const int64_t denominator=0x1000000LL*(age?2:1);
    // Source adds float0.95 (3f733333=15938355/2^24) before signed ftol.
    const int64_t value=sourceHealthFloatInteger(baseline)*coefficient+15938355LL*(age?2:1);
    return static_cast<uint32_t>(std::max<int64_t>(1,value/denominator));
}
inline int sourceStatusFirstHealth(int oldMaximum,int newMaximum,int first)
{
    if(first<=0)return 0;
    const int lost=oldMaximum-first;
    // Original+58 stores wounds; preserve those, clamp to max-1, never kills.
    return newMaximum-std::min(lost,newMaximum-1);
}
inline int sourcePoisonNextPercent(int current){return std::min(50,current+10);}
}
