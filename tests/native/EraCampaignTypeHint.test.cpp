#include "../../work/vcmi-wasm/lib/era/EraCampaignTypeHintRule.h"
#include <cassert>
#include <climits>
#include <initializer_list>
int main()
{
 using namespace era_campaign_type_hints;
 const auto absent=[](int){return INT_MIN;};
 // Source stores W index-1, masks its value to five bits, and truncates both
 // object identifiers to a byte. These are the original packed key words.
 assert(key(63,18,'T')==0x10003f12u);
 assert(key(63,18,'W',21,1)==0x40943f12u);
 assert(key(63,48,'V',240,3)==0x8cef3f30u);
 assert(key(319,-1,'T')==0x10003fffu);
 assert(key(63,18,'W',21,32)==key(63,18,'W',21,0));
 for(int index=1;index<=100;++index)for(int value=0;value<=32;++value)
 {
  const auto packed=key(63,18,'W',index,value);
  assert(accepts(packed,63,18,[&](int i){assert(i==index);return value&31;},absent));
  assert(!accepts(packed,63,18,[&](int){return (value&31)+1;},absent));
  assert(!accepts(packed,63,19,absent,absent));
 }
 for(int index=1;index<=1000;++index)for(int value=0;value<=3;++value)
 {
  const auto packed=key(63,18,'V',index,value);
  assert(accepts(packed,63,18,absent,[&](int i){assert(i==index);return value;}));
  assert(!accepts(packed,63,18,absent,[&](int){return value+1;}));
 }
 for(const char mode:{'W','V'})
 {
  bool rejected=false;try{key(63,18,mode,0,0);}catch(const std::runtime_error &){rejected=true;}assert(rejected);
 }
}
