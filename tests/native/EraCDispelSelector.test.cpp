#include "../../work/vcmi-wasm/lib/era/EraCDispelSelector.h"
#include <cassert>
#include <vector>
#include <utility>
int main()
{
    using namespace era_bridge;
    CDispelSnapshot s;s.rank=10;s.actorAlive=s.targetAlive=s.hasListedBuff=true;s.targetSourceId=0;
    std::vector<std::pair<int,int>> draws;
    auto rng=[&](int a,int b){draws.emplace_back(a,b);return a;};
    assert(selectSourceCDispel(s,rng));assert(draws.size()==2);
    s.actorAlive=false;draws.clear();assert(!selectSourceCDispel(s,rng));assert(draws.size()==1);s.actorAlive=true;
    s.rank=0;draws.clear();assert(!selectSourceCDispel(s,rng));assert(draws.empty());s.rank=10;
    s.targetSourceId=160;draws.clear();assert(!selectSourceCDispel(s,rng));assert(draws.size()==1);s.targetSourceId=0;
    s.mirrorActive=true;s.mirrorThreshold=20;draws.clear();assert(!selectSourceCDispel(s,rng));assert(draws.size()==2 && draws[1].second==50);s.mirrorActive=false;
    s.hasListedBuff=false;draws.clear();assert(!selectSourceCDispel(s,rng));assert(draws.size()==1);s.hasListedBuff=true;
    s.sphereOfPermanence=true;draws.clear();assert(!selectSourceCDispel(s,rng));assert(draws.size()==3);s.sphereOfPermanence=false;
    s.defendingHeroResistance=20;draws.clear();assert(!selectSourceCDispel(s,rng));assert(draws.size()==3);
    auto high=[](int,int hi){return hi;};s.rank=10;assert(!selectSourceCDispel(s,high));
    int effect=99;s=CDispelSnapshot{};s.rank=10;s.actorAlive=s.targetAlive=s.hasListedBuff=true;s.targetSourceId=160;
    draws.clear();assert(!selectSourceCDispel(s,rng,&effect));assert(effect==78 && draws.size()==1);
    s.targetSourceId=0;s.mirrorActive=true;s.mirrorThreshold=20;
    draws.clear();assert(!selectSourceCDispel(s,rng,&effect));assert(effect==3 && draws.size()==2);
    s.mirrorActive=false;s.defendingHeroResistance=20;
    draws.clear();assert(!selectSourceCDispel(s,rng,&effect));assert(effect==78 && draws.size()==3);
    s.defendingHeroResistance=0;
    draws.clear();assert(selectSourceCDispel(s,rng,&effect));assert(effect==0 && draws.size()==2);
    static_assert(sourceCDispelBuffs.size()==20);
}
