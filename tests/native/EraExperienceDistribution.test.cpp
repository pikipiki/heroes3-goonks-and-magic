#include "../../work/vcmi-wasm/lib/era/EraExperienceDistribution.h"
#include "../../work/vcmi-wasm/lib/era/EraExperience.h"
#include <cassert>
int main()
{
    using era_bridge::distributeExperienceModeZero;
    assert((distributeExperienceModeZero(101,{1,1})==std::vector<uint64_t>{50,50}));
    assert((distributeExperienceModeZero(101,{.5f,.5f})==std::vector<uint64_t>{50,50}));
    assert((distributeExperienceModeZero(101,{.5f,1})==std::vector<uint64_t>{33,67}));
    assert((distributeExperienceModeZero(101,{.5f})==std::vector<uint64_t>{101}));
    era_bridge::ExperienceProgression p{17500,12250,50,.5f,.75f};
    assert(p.gain(0,101)==101); // weight was consumed once inarmy distribution
    assert(p.gain(0,99999)==8750);
    for(int slots=1;slots<=7;++slots)
     for(int mask=0;mask<(1<<slots);++mask)
      for(int reward:{0,1,2,3,11,9999,2147483647})
      {
        std::vector<float>w;int numeratorSum=0;
        for(int i=0;i<slots;++i){int n=1+((mask>>i)&1);w.push_back(n/2.f);numeratorSum+=n;}
        auto a=distributeExperienceModeZero(reward,w);
        for(int i=0;i<slots;++i)assert(a[i]==uint64_t(reward)*(1+((mask>>i)&1))/numeratorSum);
      }
    bool rejected=false;try{distributeExperienceModeZero(1,{.25f});}catch(...){rejected=true;}assert(rejected);
}
