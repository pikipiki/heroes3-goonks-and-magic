#include "../../work/vcmi-wasm/lib/era/EraHorn266.h"
#include <cassert>
#include <limits>
int main()
{
 using namespace era_bridge;
 assert(horn266Count(10,0,50,50,true,false,20,true)==5);
 assert(horn266Count(10,0,10,50,true,false,20,true)==2);
 assert(horn266Count(3,0,50,50,true,false,20,true)==1);
 assert(horn266Count(1,0,10000,50,true,false,20,true)==0);
 assert(horn266Count(10,0,50,50,true,false,21,true)==0);
 assert(horn266Count(10,0,50,50,false,false,20,true)==0);
 assert(horn266Count(10,0,50,50,true,true,20,true)==0);
 assert(horn266Count(10,0,50,50,true,false,20,false)==0);
 assert(horn266Count(0,0,50,50,true,false,20,true)==0);
 assert(horn266Count(10,1,50,50,true,false,20,true)==0);
 assert(horn266Count(std::numeric_limits<int32_t>::max(),0,50,50,true,false,20,true)==0);
 assert(horn266GainAdd(0,7,0)==7);
 assert(horn266GainAdd(7,3,9)==7);
 assert(horn266GainAdd(7,6,4)==9);
 assert(horn266GainAdd(std::numeric_limits<int32_t>::max(),1,0)==std::numeric_limits<int32_t>::min());
 assert(horn266ArmySlot({{-1,263,-1,-1,-1,-1,-1}})==1);
 assert(horn266ArmySlot({{1,-1,-1,-1,-1,-1,-1}})==1);
 assert(horn266ArmySlot({{1,2,3,4,5,6,7}})==-1);
}
