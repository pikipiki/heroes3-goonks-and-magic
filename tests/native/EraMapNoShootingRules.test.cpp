#include "../../work/vcmi-wasm/lib/era/EraMapNoShootingRules.h"
#include <cassert>
#include <limits>
#include <initializer_list>
int main()
{
    using namespace era_bridge::map_rules;
    assert(noShootingHealth(1)==1);
    assert(noShootingHealth(3)==4);
    assert(noShootingHealth(10)==15);
    assert(noShootingHealth(1000000)==1500000);
    assert(noShootingHealth(-3)==-4);
    assert(noShootingHealth(std::numeric_limits<int32_t>::max())==1073741822);
    assert(noShootingHealth(1000000000)==-647483648);
    for(int code:{69,83,115})assert(noShootingClearsExperienceRow(102,code));
    for(int ability:{79,105,111})assert(noShootingClearsExperienceRow(ability,0));
    for(int ability:{72,65,68,77,83,109,0})assert(!noShootingClearsExperienceRow(ability,83));
    assert(!noShootingClearsExperienceRow(102,70));
}
