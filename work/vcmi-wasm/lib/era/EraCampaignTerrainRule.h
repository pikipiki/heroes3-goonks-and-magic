/* Source tile masks retain the hidden object's identity for later restoration. */
#pragma once
#include <algorithm>
#include <cstdint>
#include <vector>
namespace era_campaign_terrain
{
inline constexpr std::uint8_t byteWord(int value){return static_cast<std::uint8_t>(value);}
inline constexpr int byteQuery(int value){const auto word=byteWord(value);return word<128?word:static_cast<int>(word)-256;}
// TR:E writes the inverse of the native activation bit0x10.
inline int entranceValue(bool visitable){return visitable?0:1;}
inline bool entranceVisitable(int value){return value==0;}
template<class T> void hide(std::vector<T> & active,std::vector<T> & hidden)
{
 for(const auto & item:active)if(std::find(hidden.begin(),hidden.end(),item)==hidden.end())hidden.push_back(item);
 active.clear();
}
template<class T,class Predicate> void restore(std::vector<T> & active,std::vector<T> & hidden,Predicate valid)
{
 std::vector<T> merged;
 for(const auto & item:hidden)if(valid(item)&&std::find(merged.begin(),merged.end(),item)==merged.end())merged.push_back(item);
 for(const auto & item:active)if(std::find(merged.begin(),merged.end(),item)==merged.end())merged.push_back(item);
 active=std::move(merged);hidden.clear();
}
}
