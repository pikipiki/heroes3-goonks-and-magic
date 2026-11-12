#include "../../work/vcmi-wasm/lib/era/EraInterference.h"
#include <cassert>
#include <limits>
int main()
{
 using era_bridge::interferencePower;
 assert(interferencePower(13,false,false,false)==13);
 assert(interferencePower(13,true,false,false)==11);
 assert(interferencePower(13,false,true,false)==11);
 assert(interferencePower(13,false,false,true)==9);
 assert(interferencePower(13,true,true,true)==7);
 assert(interferencePower(1,true,true,true)==1);
 assert(interferencePower(0,false,false,false)==0);
 assert(interferencePower(0,true,false,false)==1);
 const int max=std::numeric_limits<int>::max();
 assert(interferencePower(max,true,true,true)==int(int64_t(max)*55/100));
}
