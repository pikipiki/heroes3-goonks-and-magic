/* Original HT packed keys, including the W value32 alias to value0. */
#pragma once
#include <cstdint>
#include <stdexcept>
namespace era_campaign_type_hints
{
inline std::uint32_t key(int type,int subtype,char mode,int index=0,int value=0)
{
 const auto identity=(static_cast<std::uint32_t>(type)&255u)*256u+(static_cast<std::uint32_t>(subtype)&255u);
 if(mode=='T')return 0x10000000u|identity;
 if(mode=='W')
 {
  if(index<1||index>100||value<0||value>32)throw std::runtime_error("Invalid original W hint selector");
  return 0x40000000u|identity|((index-1u)<<16)|((static_cast<std::uint32_t>(value)&31u)<<23);
 }
 if(mode=='V')
 {
  if(index<1||index>1000||value<0||value>3)throw std::runtime_error("Invalid original V hint selector");
  return 0x80000000u|identity|((index-1u)<<16)|(static_cast<std::uint32_t>(value)<<26);
 }
 throw std::runtime_error("Unadmitted original hint mode");
}
template<class W,class V>bool accepts(std::uint32_t packed,int type,int subtype,W readW,V readV)
{
 if((packed&65535u)!=((static_cast<std::uint32_t>(type)&255u)*256u+(static_cast<std::uint32_t>(subtype)&255u)))return false;
 switch(packed&0xf0000000u)
 {
  case 0x10000000u:return true;
  case 0x40000000u:return readW(int((packed>>16)&127u)+1)==int((packed>>23)&31u);
  case 0x80000000u:return readV(int((packed>>16)&1023u)+1)==int((packed>>26)&3u);
 }
 return false;
}
}
