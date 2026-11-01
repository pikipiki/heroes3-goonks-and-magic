#include "../../work/vcmi-wasm/lib/era/EraStatusSelectors.h"
#include <cassert>
int main()
{
 using namespace era_bridge;
 assert(sourcePoisonChance(0)==0);assert(sourcePoisonChance(10)==50);
 assert(!sourceCPoisonEligible(true,true,false,0));
 for(int id:{26,27,151,82,83,155,132,112,127,115,123,114,129,113,125,120,121,182,191,32,33,116,117,172,30,31})
 {assert(sourceCPoisonExcludedId(id));assert(!sourceCPoisonEligible(false,false,false,id));assert(sourceCPoisonEligible(false,true,false,id));}
 assert(sourceCPoisonEligible(false,false,false,271)); // living construct is not original hardcoded golem
 assert(!sourceCPoisonEligible(false,false,true,271));assert(sourceCPoisonEligible(false,true,true,271));
 assert(sourceAccuracyPercent(.8f)==80);assert(sourceAccuracyPercent(.6f)==60);
 assert(sourceAccuracyPercent(static_cast<float>(1.0-double(sourceHeroResistance(3,1,true,false,false,false))))==78); // source FPU truncation, not nominal79
 assert(sourceAccuracyPercent(.7f,.8f)==55); // fractional native-ceil mismatch
 assert(sourceAccuracyPercent(1.0f,.8f)==80); // Orb removes intrinsic/hero resistance, not aura
 assert(sourceCHeroResistance(3,1,true,false,false,false)==21);
 assert(sourceCHeroResistance(3,10,true,true,true,true)==60);
 assert(sourceHeroResistance(3,10,true,true,true,true)>.599f);
 assert(statusRollAccepts(20,20,50));assert(!statusRollAccepts(20,21,50));
 for(int id:{26,27,82,132,172}){assert(sourceCPoisonExcludedId(id));assert(!sourceCAgeExcludedId(id));assert(sourceCAgeEligible(false,false,false,id));}
 for(int id:{32,33,116,117,112,127,115,123,114,129,113,125,120,121,182,191,83,155,151,30,31}){
  assert(sourceCAgeExcludedId(id));assert(!sourceCAgeEligible(false,false,false,id));assert(sourceCAgeEligible(false,true,false,id));assert(!sourceCAgeEligible(true,true,false,id));
 }
 assert(!sourceCAgeEligible(false,false,true,224));assert(sourceCAgeEligible(false,true,true,224));
 assert(sourceCAgeEligible(false,false,false,271));
 for(int id=160;id<=167;++id)assert(sourceCAlwaysExcludedId(id));
}
