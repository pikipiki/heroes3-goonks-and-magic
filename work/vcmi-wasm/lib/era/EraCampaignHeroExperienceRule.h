/* Pinned WoG HE:E uses a signed experience dword and a signed level word. */
#pragma once
#include <cstdint>
namespace era_campaign_hero_experience
{
inline int levelWord(std::uint32_t value)
{const auto word=static_cast<std::uint16_t>(value);return word<32768?word:int(word)-65536;}
template<class Required> int levelFor(std::int32_t experience,int maximum,Required required)
{
 if(experience<0)return 0;
 int level=1;while(level<maximum&&required(level+1)<=static_cast<std::uint32_t>(experience))++level;
 return level;
}
}
