#include "../../work/vcmi-wasm/lib/era/EraExperienceCastTargets.h"
#include <cassert>
#include <set>
int main()
{
    for(int center=0;center<187;++center)
    {
        const auto values=era_bridge::sourceAdvancedBerserkHexes(center);
        assert(values.size()<=7);
        assert(std::set<int>(values.begin(),values.end()).size()==values.size());
        for(const int hex:values)assert(hex%17>0 && hex%17<16 && hex>=0 && hex<187);
    }
    const auto center=era_bridge::sourceAdvancedBerserkHexes(93);
    assert((center==std::vector<int>{94,76,110,93,75,109,92}));
    assert(era_bridge::sourceAdvancedBerserkHexes(-1).empty());
}
