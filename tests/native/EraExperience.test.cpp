#include "../../work/vcmi-wasm/lib/era/EraExperience.h"
#include <cassert>
#include <iostream>

int main()
{
    const era_bridge::ExperienceProgression phoenix{147000,14700,20,1.0f,.75f};
    const std::array<uint64_t,10> thresholds{{8400,16800,26880,38640,52080,67200,84000,102480,123480,147000}};
    for(int i=0; i<10; ++i)
    {
        assert(phoenix.threshold(i+1)==thresholds[i]);
        assert(phoenix.rank(thresholds[i]-1)==i);
        assert(phoenix.rank(thresholds[i])==i+1);
    }
    assert(phoenix.rank(0)==0);
    assert(phoenix.rank(161700)==10);
    assert(phoenix.maximum()==161700);
    assert(phoenix.battleLimit()==29400); // fullRank10, not maximum*percent
    assert(phoenix.threshold(11)==161700);
    assert(phoenix.gain(0,100000)==29400);
    assert(phoenix.gain(160000,100000)==1700);
    assert(phoenix.gain(161700,100000)==0);
    assert(phoenix.gain(200000,100000)==0); // no unsigned cap subtraction
    assert(phoenix.retainOnUpgrade(10000)==7500);
    assert(phoenix.total(phoenix.retainOnUpgrade(5),3)==9); // per-unit truncation
    assert(phoenix.total(10000,20)==200000);
    // Merge20@10000 with5@0: weighted per-unit integer XP, preserved on split.
    const auto mergedAverage=(phoenix.total(10000,20)+phoenix.total(0,5))/25;
    assert(mergedAverage==8000);
    assert(phoenix.total(mergedAverage,25)==200000);
    assert(phoenix.total(mergedAverage,20)+phoenix.total(mergedAverage,5)==200000);
    std::cout << "ERA252 progression:45 boundary/gain/upgrade/merge assertions passed\n";
}
