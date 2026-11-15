#include "../../work/vcmi-wasm/lib/era/EraCampaignDeploymentRule.h"
#include <cassert>
#include <set>
#include <limits>
int main()
{
 using namespace era_campaign_deployment_rule;
 assert(maximum(1,1,139)==0);
 assert(maximum(1,2,139)==1);
 assert(maximum(5000,5000,139)==4095);
 assert(maximum(5000,3,139)==2);
 assert(maximum(0,5,139)==0);
 assert(maximum(5,5,-1)==0);
 for(int id:{159,160,161,162,163,340})assert(maximum(5,5,id)==0);
 assert(maximum(5,5,164)==4);
 assert(maximum(5,5,139,true)==0);
 std::set<std::pair<int,int>> cells;
 for(const auto & d:directions){assert(adjacent(20,26,0,20+d[0],26+d[1],0));cells.emplace(d[0],d[1]);}
 assert(cells.size()==8);
 assert(!adjacent(20,26,0,20,26,0));
 assert(!adjacent(20,26,0,21,26,1));
 assert(!adjacent(20,26,0,22,26,0));
 assert(!adjacent(20,26,0,std::numeric_limits<int>::min(),26,0));
 assert(!adjacent(std::numeric_limits<int>::max(),26,0,std::numeric_limits<int>::min(),26,0));
}
