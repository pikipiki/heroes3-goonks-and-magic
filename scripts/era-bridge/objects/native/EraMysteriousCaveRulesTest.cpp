#include "EraMysteriousCaveRules.h"
#include "EraMysteriousCaveDemolition.h"
#include <cassert>
#include <vector>
#include <utility>
#include <climits>

struct RecordingRng
{
 std::vector<std::pair<int,int>> bounds;
 bool maximum=false;
 int operator()(int low,int high){bounds.emplace_back(low,high);return maximum?high:low;}
};
int main()
{
 using namespace era_bridge;
 RecordingRng low;
 const auto first=rollCaveDaily(1,low);
 assert(low.bounds.size()==14);
 assert((low.bounds[2]==std::pair<int,int>{1000,5000}));
 assert((low.bounds[11]==std::pair<int,int>{500,2000}));
 assert(first.experience==500&&first.stat==1&&first.mana==100&&first.commanderArtifact==146);
 RecordingRng high;high.maximum=true;
 const auto month2=rollCaveDaily(29,high);
 assert(month2.experience==4000&&month2.stat==8&&month2.blessing==12&&month2.resourceAmount==40);
 assert(month2.remoteObject==7&&month2.movement==4000);
 const auto & villageHall=era::caveDemolitionRules.at(0).at(10);
 assert(villageHall.gold==500&&villageHall.salvage.at(0)==0);
 assert((villageHall.dependencies&(UINT64_C(1)<<11))!=0);
 assert((villageHall.dependencies&(UINT64_C(1)<<10))==0);
 assert(era::caveDemolitionSurcharges.at(3)==5000&&era::caveDemolitionSurcharges.at(4)==0);
 assert(caveSignedProduct(INT_MAX,2)==-2);
 assert(caveSignedValue(0xffffffffu)==-1);
 assert(caveSignedValue(0x80000000u)==INT_MIN);
 RecordingRng weekly;
 assert(rollCaveWeekly(true,false,false,false,weekly)==10);
 assert((weekly.bounds.back()==std::pair<int,int>{10,64}));
 assert(rollCaveWeekly(false,true,false,false,weekly)==20);
 assert((weekly.bounds.back()==std::pair<int,int>{20,54}));
 auto watcher=[](int,int){return 44;};assert(rollCaveWeekly(true,false,true,false,watcher)==43);
 auto obelisk=[](int,int){return 36;};assert(rollCaveWeekly(true,false,false,true,obelisk)==43);
 CaveHeroTimers timers{7,7,7,7,7,7,7};
 for(int i=0;i<6;++i)tickCaveHeroTimers(timers);
 assert(timers.builder==1&&timers.scourge==1&&timers.speed==1);
 tickCaveHeroTimers(timers);assert(timers.speed==0&&timers.builder==1&&timers.scourge==1);
 assert(caveEffectiveChoice(23,true)==25&&caveEffectiveChoice(23,false)==23);
 assert(caveMageGuildMaximum(0)==4&&caveMageGuildMaximum(6)==3&&caveMageGuildMaximum(7)==3&&caveMageGuildMaximum(8)==5);
 assert((caveRemotePrimaryBonus(5)==std::array<int,4>{2,2,2,2}));
 assert((caveRemotePrimaryBonus(6)==std::array<int,4>{2,0,0,0}));
}
