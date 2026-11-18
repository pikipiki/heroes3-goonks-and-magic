#include "../../work/vcmi-wasm/lib/era/EraCreatureLevelRules.h"
#include "../../work/vcmi-wasm/lib/era/EraCampaignProgram.h"
#include <cassert>
#include <climits>
int main()
{
 using era_bridge::creature_levels::writeLevel;
 constexpr int inputs[]={INT_MIN,-2147483643,-100,-2,-1,0,1,5,6,7,100,INT_MAX};
 constexpr int expected[]={-1,-1,-1,-1,-1,0,1,5,6,6,6,6};
 for(unsigned i=0;i<sizeof(inputs)/sizeof(*inputs);++i)assert(writeLevel(inputs[i])==expected[i]);
 assert(era_campaign::add(6,INT_MAX)==-2147483643);
 assert(writeLevel(era_campaign::add(6,INT_MAX))==-1);
 assert(writeLevel(era_campaign::add(-1,INT_MIN))==6);
 assert(writeLevel(era_campaign::add(3,-4))==-1);
}
