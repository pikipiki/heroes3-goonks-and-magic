/* Pure original square flag/latest-descriptor semantics. GPL-2.0-or-later. */
#pragma once
#include <array>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <vector>
namespace era_bridge_xp_geometry
{
struct HexState
{
    std::array<int32_t,187> flags{};
    std::array<int32_t,187> latest{};
    HexState(){latest.fill(-1);}
};
inline bool valid(int p){return p>=0&&p<187;}
inline void created(HexState & s,int anchor,const std::vector<int> & shape,int id,int flags)
{
    if(id<0||flags<0||flags>63)throw std::invalid_argument("Source XP descriptor");
    if(!flags)return;
    for(int p:shape)if(valid(p)){s.flags[p]|=flags&~1;s.latest[p]=id;}
    if(valid(anchor)){s.flags[anchor]|=1;s.latest[anchor]=id;}
}
inline void removed(HexState & s,int anchor,const std::vector<int> & shape)
{
    //64 is private cache metadata: underlying native terrain was cleared here.
    //It is not a source square bit, and never enters source low6 tests.
    for(int p:shape)if(valid(p)){s.flags[p]=64;s.latest[p]=-1;}
    if(valid(anchor)){s.flags[anchor]=(s.flags[anchor]&~1)|64;s.latest[anchor]=-1;}
}
inline int32_t rawValue(int power,int coefficient,int flat)
{
    const uint32_t raw=uint32_t(power)*uint32_t(coefficient)+uint32_t(flat);
    int32_t result;std::memcpy(&result,&raw,sizeof(raw));return result;
}
// Explicit anti-corruption domain, not an undefined-behavior repair. The
// original signed Win32 count<=0 still allocates an occupying source record;
// this port retains latest-elemental bookkeeping but omits that invalid unit.
inline bool positiveSummonDomain(int32_t wrappedCount){return wrappedCount>0;}
inline std::vector<int32_t> encode(const HexState & s)
{
    std::vector<int32_t> p{0x585047,1};p.insert(p.end(),s.flags.begin(),s.flags.end());p.insert(p.end(),s.latest.begin(),s.latest.end());return p;
}
inline HexState decode(const std::vector<int32_t> & p)
{
    if(p.size()!=376||p[0]!=0x585047||p[1]!=1)throw std::invalid_argument("Source XP cache version");
    HexState s;for(int i=0;i<187;++i){if(p[2+i]<0||p[2+i]>127||p[189+i]<-1)throw std::invalid_argument("Source XP cache field");s.flags[i]=p[2+i];s.latest[i]=p[189+i];}return s;
}
}
