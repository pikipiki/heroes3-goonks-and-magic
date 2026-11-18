#include "../../work/vcmi-wasm/lib/era/EraMithrilDisplayRules.h"
#include <cassert>
#include <initializer_list>
int main()
{
 using namespace era_bridge::mithril;
 for(bool enhancements:{false,true})for(bool display:{false,true})for(bool replacement:{false,true})for(bool weekly:{false,true})
 {
  (void)weekly;
  // Literal sequential initialization36,149,170,171, independent of helpers.
  bool live149=display;
  if(enhancements)live149=true;
  const bool captured149=live149;
  if(replacement)live149=true;
  assert(displaySnapshot(display,enhancements)==captured149);
  assert(displayLiveOption(captured149,replacement)==live149);
 }
 assert(displayPlural(-1)==0&&displayPlural(0)==0&&displayPlural(1)==0&&displayPlural(2)==1);
}
