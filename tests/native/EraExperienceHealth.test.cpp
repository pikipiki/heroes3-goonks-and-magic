#include "../../work/vcmi-wasm/lib/era/EraExperienceHealth.h"
#include "../../work/vcmi-wasm/lib/era/EraStatusHealth.h"
#include <cassert>
#include <cstdint>
int main()
{
 assert(era_bridge::sourceExperienceHealth(15,0)==15);
 assert(era_bridge::sourceExperienceHealth(15,50)==23);
 assert(era_bridge::sourceExperienceHealth(17,50)==26); // vial+2 already in base
 assert(era_bridge::sourceExperienceHealth(22,50)==33); // Elixir:15+4+floor(15/4)
 const auto elixirXp=era_bridge::sourceExperienceHealth(22,50);
 assert(era_bridge::sourceStatusMaxHealth(elixirXp,0,true)==17);
 assert(era_bridge::sourceStatusMaxHealth(elixirXp,10,true)==15);
 assert(era_bridge::sourceExperienceHealth(400,50)==600);
 assert(era_bridge::sourceExperienceHealth(10000,50)==15000);
 for(int32_t base=1;base<=3000;++base)
  for(int32_t rank=0;rank<=10;++rank)
   assert(era_bridge::sourceExperienceHealth(base,rank*5)==(int64_t(base)*(100+rank*5)+50)/100);
 assert(era_bridge::sourceExperienceHealth(16777217,0)==16777216); // source binary32 base
 bool rejected=false;try{era_bridge::sourceExperienceHealth(15,-1);}catch(const std::invalid_argument&){rejected=true;}assert(rejected);
}
