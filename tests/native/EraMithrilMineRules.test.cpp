#include "../../work/vcmi-wasm/lib/era/EraMithrilMineRules.h"
#include <cassert>
#include <cstdint>
#include <limits>
int main()
{
    using namespace era_bridge::mithril;
    assert(legacyMineMarker(true,true,1,0)==7);
    assert(legacyMineMarker(true,false,1,200)==0);
    assert(legacyMineMarker(false,false,1,8)==7);
    assert(legacyMineMarker(false,true,7,8)==1);
    assert(legacyMineMarker(false,true,8,8)==0);
    assert(legacyMineMarker(false,false,9,8)==0);
    assert(legacyMineMarker(false,false,1,std::numeric_limits<std::int64_t>::max())==15);
    assert(legacyMineMarker(false,false,1,std::numeric_limits<std::int64_t>::min())==0);
    int marker=7,periods=0;
    while(marker){++periods;marker=nextMineMarker(marker);}
    assert(periods==7);
    assert(nextMineMarker(0)==0);
    assert(nextMineMarker(15)==14);
}
