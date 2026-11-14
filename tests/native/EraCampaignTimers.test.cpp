#include "../../work/vcmi-wasm/lib/era/EraCampaignTimers.h"
#include <cassert>
int main(){
 using namespace era_campaign_timers;
 Settings weekly{1,999,7,255};for(int color=0;color<8;++color)for(int day=1;day<100;++day)assert(due(weekly,day,color)==((day-1)%7==0));
 Settings late{6,20,7,2};for(int day=1;day<=28;++day){assert(due(late,day,1)==(day==6||day==13||day==20));assert(!due(late,day,0));}
 assert(due(Settings{0,999,1,64},1,6));assert(!due(Settings{0,0,100,64},1,6));assert(!due(Settings{2,1,100,0},2,6));
 assert(due(Settings{1,1,999,1},1,0));assert(!due(Settings{1,1,999,1},2,0));
 assert(word(-1)==65535&&word(65536)==0&&word(65537)==1);
 Settings mask{1,999,1,65535};access(mask,false,3);assert(mask[3]==65527&&!due(mask,1,3)&&due(mask,1,2));access(mask,true,3);assert(mask[3]==65535&&due(mask,1,3));
 assert(!due(Settings{},1,0));bool rejected=false;try{due(Settings{1,999,0,1},1,0);}catch(const std::runtime_error &){rejected=true;}assert(rejected);
 rejected=false;try{access(mask,true,8);}catch(const std::runtime_error &){rejected=true;}assert(rejected);
 // The caller visits timer IDs in ascending order and checks live settings.
 std::array<Settings,3> timers{{Settings{1,999,1,1},Settings{1,999,1,1},Settings{1,999,1,1}}};int visited=0;
 for(int id=0;id<3;++id)
 {
  if(due(timers[id],1,0))
  {
   visited=visited*10+id+1;
   if(id==0)access(timers[1],false,0);
  }
 }
 assert(visited==13);
}
