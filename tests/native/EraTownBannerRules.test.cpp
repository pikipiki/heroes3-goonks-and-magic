#include "../../work/vcmi-wasm/lib/era/EraTownBannerRules.h"
#include <cassert>
#include <vector>
int main()
{
    using namespace era_bridge::town_banners;
    using P=std::array<int,3>;
    for(int accepted=-1;accepted<3;++accepted)
    {
        std::vector<P> tested;
        const auto result=placement(8,9,1,36,[&](P p){tested.push_back(p);return int(tested.size())-1==accepted;});
        const std::vector<P> expected{{8,10,1},{9,10,1},{7,10,1}};
        assert(bool(result)==(accepted>=0));
        assert(int(tested.size())==(accepted<0?3:accepted+1));
        for(unsigned i=0;i<tested.size();++i)assert(tested[i]==expected[i]);
        if(result)assert(*result==expected[accepted]);
    }
    // Source compares y<N before incrementing: it still tests the y=N row.
    int calls=0;const auto edge=placement(0,35,0,36,[&](P p){++calls;assert(p[1]==36);return false;});
    assert(!edge&&calls==3);
    calls=0;assert(!placement(0,36,0,36,[&](P){++calls;return true;}));assert(calls==0);
    for(int difficulty=0;difficulty<=4;++difficulty)
    {
        for(int faction=0;faction<9;++faction)
        {
            const auto g=guardian(faction,difficulty);
            if(difficulty>2)assert(g.fixedSource==150+faction);
            else {assert(g.tier==(difficulty==2?6:5));assert(g.upgraded==(difficulty!=1));assert(g.fixedSource==-1);}
        }
        for(int day=1;day<=85;++day)
        {
            const bool expected=day>1&&(day%28==1||((difficulty%2==0)&&day%28==15));
            assert(grows(day,difficulty)==expected);
        }
    }
    assert(initialGuard(true).count==1&&!initialGuard(true).enabled);
    assert(initialGuard(false).count==1&&initialGuard(false).enabled);
    assert(!eligibleForGrowth(-2,true));assert(!eligibleForGrowth(-3,true));
    assert(eligibleForGrowth(-1,true));assert(eligibleForGrowth(7,true));
    assert(!eligibleForGrowth(0,false));
}
