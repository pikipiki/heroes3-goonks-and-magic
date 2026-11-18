#include "../../work/vcmi-wasm/lib/era/EraMapExtraDwellingRules.h"
#include <cassert>
#include <initializer_list>
int main()
{
    using namespace era_bridge::map_rules;
    assert(extraDwellingInitialStock==12);
    assert(!extraDwellingOption(false,false)&&!extraDwellingOption(false,true));
    assert(extraDwellingOption(true,false)==0&&extraDwellingOption(true,true)==1);
    assert(extraDwellingSourceCreature(false)==140&&extraDwellingSourceCreature(true)==112);
    for(int level=-1;level<8;++level)
        for(int creature=0;creature<363;++creature)
        {
            const bool expected=level!=0&&creature!=140&&creature!=142&&creature!=112&&creature!=127;
            assert(extraDwellingCreature(17,creature,level)==expected);
            for(int object:{20,78,106,216})assert(!extraDwellingCreature(object,creature,level));
        }
}
