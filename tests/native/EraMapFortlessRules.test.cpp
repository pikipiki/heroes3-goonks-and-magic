#include "../../work/vcmi-wasm/lib/era/EraMapFortlessRules.h"
#include <cassert>
#include <initializer_list>
int main()
{
 using era_bridge::map_rules::removeInitialFortifications;
 for(bool enabled:{false,true})for(bool preserveAi:{false,true})
 {
  assert(removeInitialFortifications(enabled,preserveAi,false,false)==enabled); // Neutral towns are included.
  assert(removeInitialFortifications(enabled,preserveAi,true,true)==enabled); // Human towns are included.
  assert(removeInitialFortifications(enabled,preserveAi,true,false)==(enabled&&!preserveAi));
 }
}
