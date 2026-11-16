/* Pinned WoG3.58f HE:Y type2: slot encoding and inclusive expiry. */
#pragma once
#include <cstdint>
#include <stdexcept>
namespace era_campaign_slot_curse
{
inline int slot(int encoded)
{
 const int result=encoded>32?encoded&15:encoded;
 if(result<0||result>8)throw std::runtime_error("Invalid original cursed artifact slot");
 return result;
}
inline int nativeSlot(int source){if(source<0||source>8)throw std::runtime_error("Invalid original raw cursed slot");return source==7?8:source==8?17:source;}
inline int encode(int source,int artifact)
{
 nativeSlot(source);if(artifact<-1||artifact>143)throw std::runtime_error("Invalid original cursed artifact");
 return source+((artifact+1)<<5);
}
inline int artifact(int encoded){slot(encoded);return encoded>32?(encoded>>5)-1:-1;}
inline int lockCount(int count,int delta){return (static_cast<unsigned>(count)+delta)&255u;}
inline int word(std::uint32_t value){return value<=0x7fffffffu?int(value):int(std::int64_t(value)-0x100000000LL);}
inline int add(int left,int right){return word(std::uint32_t(left)+std::uint32_t(right));}
inline int subtract(int left,int right){return word(std::uint32_t(left)-std::uint32_t(right));}
inline bool expired(int start,int length,int day){return add(start,length)<day;}
}
