#include "../../work/vcmi-wasm/lib/era/EraCreatureArtifactRuntime.h"
#include <cassert>
int main()
{
 using namespace era_bridge;
 assert(!originalArmyHasMimic(false,{{1,129}},129)); // neutral army: no hero
 assert(!originalArmyHasMimic(true,{{0,129},{10,0}},129)); // count zero is not presence
 assert(originalArmyHasMimic(true,{{1,129},{100,129}},129)); // boolean, not two prayers
 assert(!originalArmyHasMimic(true,{{10,0}},129)); // summoned Cherub absent from original army
 assert(needsMimicOpeningSpell(true,true,false));
 assert(!needsMimicOpeningSpell(true,true,true)); // real Angelic Alliance already casts
 assert(!needsMimicOpeningSpell(false,true,false));
 assert(!needsMimicOpeningSpell(true,false,false));
 assert(sourceAngelicArmyMorale({{1,true,false}})==2);
 assert(sourceAngelicArmyMorale({{1,true,false},{99,true,false}})==2);
 assert(sourceAngelicArmyMorale({{1,false,true}})==1); // plus existing Supreme native+1
 assert(sourceAngelicArmyMorale({{1,true,false},{1,false,true}})==1);
 assert(1+sourceAngelicArmyMorale({{1,true,false},{1,false,false}})==3); // ordinary Angel+1 remains
 assert(sourceAngelicArmyMorale({{0,true,false}})==0);
 assert(sourceAngelicArmyMorale({})==0);
}
