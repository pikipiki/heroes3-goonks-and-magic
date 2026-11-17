#pragma once
#include <algorithm>
#include <cstdint>
#include <functional>
#include <map>
#include <set>
#include <vector>

namespace mobile_army_upgrade
{
struct Edge { int target;std::vector<int64_t> cost; };
struct Step { int source;Edge upgrade; };
using Path=std::vector<Step>;
inline Path maximumPath(int source,const std::function<std::vector<Edge>(int)> & choices,const std::function<int64_t(int)> & strength)
{
 std::set<int> visiting;
 std::function<Path(int)> visit=[&](int current){
  visiting.insert(current);Path best;
  for(const auto & edge:choices(current)){
   if(edge.target==current||visiting.count(edge.target))continue;
   auto candidate=visit(edge.target);candidate.insert(candidate.begin(),Step{current,edge});
   const auto finalId=candidate.back().upgrade.target;
   if(candidate.size()>best.size()||(candidate.size()==best.size()&&(best.empty()||strength(finalId)>strength(best.back().upgrade.target))))best=std::move(candidate);
  }
  visiting.erase(current);return best;
 };
 return visit(source);
}
}
