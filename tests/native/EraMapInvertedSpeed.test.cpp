#include "../../work/vcmi-wasm/lib/era/EraMapInvertedSpeed.h"
#include <cassert>
#include <limits>
int main()
{
 using era_bridge::map_rules::invertedSpeed;
 for(int maximum=0;maximum<=500;++maximum)
  for(int old=0;old<=maximum;++old)
   assert(invertedSpeed(maximum,old)==maximum-old+3);
 constexpr auto top=std::numeric_limits<std::int32_t>::max();
 static_assert(invertedSpeed(top,0)==1);
 static_assert(invertedSpeed(top,1)==1);
 static_assert(invertedSpeed(top,2)==1);
 static_assert(invertedSpeed(top,3)==top);
 static_assert(invertedSpeed(top,top)==3);
 assert(invertedSpeed(77,20)==60);
 assert(invertedSpeed(77,4)==76);
 assert(invertedSpeed(77,77)==3);
}
