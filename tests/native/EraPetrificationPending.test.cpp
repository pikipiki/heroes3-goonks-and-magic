#include "../../work/vcmi-wasm/lib/era/EraPetrificationPending.h"
#include <cassert>
int main(){era_bridge::PetrificationPending p; int wins=0;for(int r=1;r<=100;++r)wins+=p.succeeds(r);assert(wins==20);p.markSpell(3,207,62);assert(p.source(3)==207&&p.spell(3)==62);if(p.succeeds(21))p.markSpell(3,219,70);assert(p.spell(3)==62);p.markSpell(3,219,70);assert(p.source(3)==219&&p.spell(3)==70);p.mark(4,219);assert(p.spell(4)==70);p.clear();assert(!p.source(3));}
