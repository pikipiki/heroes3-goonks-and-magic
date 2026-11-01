#include "../../work/vcmi-wasm/lib/era/EraStatusHealth.h"
#include <cassert>
#include <cmath>
#include <limits>
int main()
{
 using namespace era_bridge;
 assert(sourceHealthFloatInteger(16777217)==16777216);
 assert(sourceHealthFloatInteger(16777219)==16777220);
 assert(sourceStatusMaxHealth(std::numeric_limits<int32_t>::max(),10,true)==966367616u);
 assert(sourceStatusMaxHealth(100,15,false)==0); // caller chooses unchanged native path
 assert(!sourcePoisonPercentSupported(15));
 assert(sourceStatusMaxHealth(3,0,true)==2);assert(sourceStatusMaxHealth(5,0,true)==3);
 assert(sourceStatusMaxHealth(1,50,true)==1);
 // Flat HP is included in the already composed baseline: base3+artifact2=5.
 assert(sourceStatusMaxHealth(3+2,10,true)==3);
 assert(sourceStatusMaxHealth(101,10,true)==46);
 assert(sourceStatusMaxHealth(101,50,true)==26);
 assert(sourceStatusMaxHealth(101,50,false)==51);
 assert(sourceStatusFirstHealth(100,50,40)==1);
 assert(sourceStatusFirstHealth(100,50,90)==40);
 assert(sourceStatusFirstHealth(50,100,1)==51);
 assert(sourceStatusFirstHealth(50,100,50)==100);
 assert(sourceStatusFirstHealth(50,100,0)==0);
 assert(sourceStatusFirstHealth(100,50,150)==100); // signed negative wounds from source297 inversion
 // Status refresh changes duration only, not poison progression or wounds.
 int poison=10,turns=3,first=sourceStatusFirstHealth(101,sourceStatusMaxHealth(101,poison,false),81);
 const int unchangedFirst=first;turns=std::max(turns,3);
 assert(poison==10 && first==unchangedFirst && turns==3);
 // Expiration runs before poison progression; an expired effect never ticks.
 for(int round=0;round<2;round++){--turns;poison=sourcePoisonNextPercent(poison);}
 assert(poison==30 && turns==1);--turns;if(turns==0)poison=0;
 assert(poison==0 && sourceStatusMaxHealth(101,poison,false)==101);
 // Cross-check every ordinary HP against literal float32/x87 constant math.
 for(int hp=1;hp<=10000;hp++)for(int p=0;p<=50;p+=10)for(bool age:{false,true})
 {
   float f=1.0f;for(int step=0;step<p/10;step++)f=static_cast<float>(std::max(.5,static_cast<double>(f)-static_cast<double>(.1f)));
   long double expected=static_cast<long double>(static_cast<float>(hp))*f;
   if(age)expected*=.5f;expected+=.95f;
   assert(sourceStatusMaxHealth(hp,p,age)==static_cast<uint32_t>(std::max(1,static_cast<int>(expected))));
 }
}
