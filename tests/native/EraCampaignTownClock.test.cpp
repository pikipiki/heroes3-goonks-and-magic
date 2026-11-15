#include "../../work/vcmi-wasm/lib/era/EraCampaignTownClock.h"
#include <cassert>
#include <limits>
int main()
{
 using namespace era_campaign_town_clock;
 for(int i=0;i<256;++i)
 {
  assert(byte(i)==i);
  assert(tick(i)==(i>0&&i<128?i-1:i));
  assert(immortal(i)==(i>=128&&i<=254));
  if(immortal(i)){assert(!warningDays(i));assert(!shadow(i));}
  else {const int remaining=i==255?7:i;assert(warningDays(i)==remaining);assert(shadow(i)==(remaining>=7?0:7-remaining));}
 }
 assert(byte(-1)==255);assert(byte(-2)==254);assert(byte(260)==4);
 assert(byte(std::numeric_limits<std::int32_t>::min())==0);
 int finite=4;for(int elapsed=0;elapsed<4;++elapsed){assert(shadow(finite)==3+elapsed);finite=tick(finite);}assert(finite==0&&shadow(finite)==7);
 for(int i:{-1,256}){bool rejected=false;try{tick(i);}catch(const std::runtime_error &){rejected=true;}assert(rejected);}
}
