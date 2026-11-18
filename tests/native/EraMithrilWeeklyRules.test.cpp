#include "../../work/vcmi-wasm/lib/era/EraMithrilWeeklyRules.h"
#include <cassert>
#include <algorithm>
#include <climits>
#include <vector>
using namespace era_bridge::mithril;
int main(){
 for(int day=0;day<70;++day){assert(weeklyDue(day,-1,true)==(day>=1&&(day-1)%7==0));assert(!weeklyDue(day,day,true));assert(!weeklyDue(day,-1,false));}
 for(int draw=1;draw<=12;++draw)assert(weeklyMithril(draw)==(draw==12));
 assert(doubleWeeklyStock(500)==1000&&doubleWeeklyStock(1000)==2000&&doubleWeeklyStock(3)==6&&doubleWeeklyStock(6)==12);
 assert(doubleWeeklyStock(INT_MAX)==-2&&doubleWeeklyStock(INT_MIN)==0);
 std::vector<SourceSitePosition> positions{{0,0,1,10},{0,2,0,5},{2,0,0,3},{1,1,0,4},{0,0,0,0},{0,1,0,2},{1,0,0,1},{3,0,0,6},{2,1,0,7},{1,2,0,8},{0,3,0,9}};
 std::sort(positions.begin(),positions.end(),sourceSiteLess);for(int i=0;i<11;++i)assert(positions[i].id==i);
}
