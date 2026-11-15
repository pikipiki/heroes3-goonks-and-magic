/* Prove a consecutive source removal batch clears every candidate.
 * Selection may choose any covered object; success is independent of order.
 * GPL-2.0-or-later. */
#pragma once
#include <cstdint>
#include <set>
#include <utility>
#include <vector>
namespace era_campaign_removal
{
inline bool guaranteedClear(const std::vector<std::uint32_t> & coverage,unsigned count)
{
 if(count>16||coverage.size()>64)return false;
 const std::uint32_t all=(std::uint32_t(1)<<count)-1;
 std::set<std::uint32_t> states{all};
 unsigned work=0;
 for(const auto covered:coverage)
 {
  if(covered&~all)return false;
  std::set<std::uint32_t> next;
  for(const auto remaining:states)
  {
   const auto choices=remaining&covered;
   if(!choices)next.insert(remaining);
   for(auto bits=choices;bits;bits&=bits-1)
   {
    if(++work>262144)return false;
    const auto selected=bits&(~bits+1);
    next.insert(remaining^selected);
   }
   if(next.size()>4096)return false;
  }
  states=std::move(next);
 }
 return states.size()==1&&*states.begin()==0;
}
}
