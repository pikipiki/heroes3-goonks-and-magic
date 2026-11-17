/* Merging bulk army transfers; GPL-2.0-or-later. */
#pragma once
#include <array>
#include <vector>
#include <cstdint>
#include <algorithm>
namespace army_bulk_transfer
{
struct Slot { int creature=-1; std::int64_t count=0; };
using Army=std::array<Slot,7>;
struct Move { bool withinDestination; int from,to; std::int64_t count; };
inline std::vector<Move> plan(const Army & source,Army destination,bool keepLast,int retainedSlot)
{
 std::vector<Move> result;
 // Consolidate the destination first so duplicate formations cannot consume
 // slots needed by a new creature family. These moves precede incoming ones.
 for(int i=0;i<7;++i)if(destination[i].count>0)
  for(int j=0;j<i;++j)if(destination[j].count>0&&destination[j].creature==destination[i].creature)
  {result.push_back({true,i,j,destination[i].count});destination[j].count+=destination[i].count;destination[i]={};break;}
 bool allMoved=true;
 for(int i=0;i<7;++i)if(source[i].count>0)
 {
  int target=-1;
  for(int j=0;j<7;++j)if(destination[j].count>0&&destination[j].creature==source[i].creature){target=j;break;}
  if(target<0)for(int j=0;j<7;++j)if(destination[j].count==0){target=j;break;}
  if(target<0){allMoved=false;continue;}
  result.push_back({false,i,target,source[i].count});
  destination[target].creature=source[i].creature;destination[target].count+=source[i].count;
 }
 if(keepLast&&allMoved)for(auto & move:result)if(!move.withinDestination&&move.from==retainedSlot)--move.count;
 result.erase(std::remove_if(result.begin(),result.end(),[](const Move & move){return move.count<=0;}),result.end());
 return result;
}
}
