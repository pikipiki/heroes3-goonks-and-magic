#include "../../work/vcmi-wasm/lib/era/EraLevelArtifactRules.h"
#include "../../work/vcmi-wasm/lib/era/EraSourceArtifactPoolRules.h"
#include <cassert>
#include <set>
#include <limits>
int main()
{
    using namespace era_bridge::source_artifact_pool;
    const std::vector<Entry> rows{{7,2,true,false},{8,2,true,false},{9,4,true,false},{10,8,false,false},{141,16,true,true}};
    std::set<int> used;
    const auto first=[](std::size_t){return 0;};
    assert(pick(rows,used,2,first)==7);assert(pick(rows,used,2,first)==8);
    assert(pick(rows,used,4,first)==9);assert(used.count(7)&&used.count(8)&&used.count(9));
    assert(pick(rows,used,2,first)==7);assert(!used.count(8));assert(used.count(9));
    // Requested class has only a banned entry: ordinary fallback first uses
    // the remaining unused treasure without resetting the other classes.
    assert(pick(rows,used,8,first)==8);assert(used.count(10));
    assert(pick(rows,used,16,first)==7);assert(!used.count(8)&&!used.count(9));
    assert(initiallyDisabled(141)&&initiallyDisabled(142)&&initiallyDisabled(143));assert(!initiallyDisabled(140));
    const std::vector<Entry> impossible{{7,2,false,false},{141,16,true,true}};
    assert(!pick(impossible,used,2,first));
    const std::vector<Entry> comboClass{{129,16,true,false}};
    assert(pick(comboClass,used,16,first)==129); // no universal combination ban
    using namespace era_bridge::level_artifacts;
    assert(classMask(5,true)==2);assert(classMask(6,true)==4);
    assert(classMask(11,false)==2);assert(classMask(12,false)==4);
    assert(classMask(18,true)==16);assert(classMask(36,false)==16);
    assert(classMask(104,true)==16);assert(classMask(105,false)==16);
    const auto requirement=[](int level)->int32_t
    {
        const int table[]{0,0,1000,2000,3200,4600,6200};
        return level<=6?table[level]:std::numeric_limits<int32_t>::max();
    };
    assert(humanBatchCount(2,3200,requirement)==3);
    assert(humanBatchCount(2,999,requirement)==0);
    assert(humanBatchCount(2,-1,requirement)==0);
    assert(humanBatchCount(104,std::numeric_limits<int32_t>::max(),requirement)==1);
    assert(humanBatchCount(105,std::numeric_limits<int32_t>::max(),requirement)==0);
}
