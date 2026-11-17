#include "../../work/vcmi-wasm/client/ArmyUpgradePath.h"
#include <cassert>
using namespace mobile_army_upgrade;
int main(){
 std::map<int,std::vector<Edge>> graph={{1,{{2,{10,1}},{8,{15,0}}}},{2,{{3,{20,2}}}},{3,{{4,{30,3}}}},{8,{{9,{25,0}}}}};
 auto choose=[&](int id){return graph[id];};auto strength=[](int id){return int64_t(id);};
 const auto path=maximumPath(1,choose,strength);assert(path.size()==3&&path.back().upgrade.target==4);int64_t gold=0,crystal=0;for(const auto & step:path){gold+=step.upgrade.cost[0];crystal+=step.upgrade.cost[1];}assert(gold==60&&crystal==6);
 assert(maximumPath(4,choose,strength).empty());
 graph[4]={{1,{1,0}},{4,{0,0}}};const auto cycle=maximumPath(1,choose,strength);assert(cycle.size()==3&&cycle.back().upgrade.target==4);
 graph={{1,{{2,{1}},{3,{1}}}}};assert(maximumPath(1,choose,strength).back().upgrade.target==3);
}
