#include "../../work/vcmi-wasm/lib/era/EraDeathBlowChance.h"
#include <cassert>
#include <algorithm>
int main()
{
    for(int chance=0;chance<=100;++chance)
    {
        int successes=0;
        for(int output=0;output<=32767;++output)
            successes+=era_bridge::sourceDeathBlowFromCrtOutput(chance,output);
        assert(successes==327*chance+std::min(chance,68));
    }
    int calls=0;
    assert(!era_bridge::rollSourceDeathBlow(0,[&](){++calls;return 0;}));
    assert(calls==0);
    assert(era_bridge::rollSourceDeathBlow(100,[&](){++calls;return 32767;}));
    assert(calls==1);
    assert(era_bridge::sourceDeathBlowFromCrtOutput(25,24));
    assert(!era_bridge::sourceDeathBlowFromCrtOutput(25,25));
    bool rejected=false;
    try{era_bridge::sourceDeathBlowFromCrtOutput(25,32768);}catch(const std::invalid_argument&){rejected=true;}
    assert(rejected);
}
