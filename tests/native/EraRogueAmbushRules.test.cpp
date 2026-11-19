#include "../../work/vcmi-wasm/lib/era/EraRogueAmbushRules.h"
#include <cassert>
#include <limits>
#include <numeric>
int main()
{
    using namespace era_bridge::rogue_ambush;
    assert(objectTypes.size()==26);assert(eligibleObject(17)&&eligibleObject(113));assert(!eligibleObject(98));
    assert(chanceMaximum(true)==15&&chanceMaximum(false)==63);
    assert(creature(true,false)==143&&creature(true,true)==115);
    assert(creature(false,false)==0&&creature(false,true)==0);
    assert(week(1)==1&&week(7)==1&&week(8)==2&&week(29)==5);
    assert(quantity(1,1)==20&&gold(20)==500);
    assert(quantity(INT32_MAX,1)==0);assert(gold(INT32_MAX)==290);
    assert(canRoll(true,1,0,0)&&!canRoll(true,1,0,1));
    assert(!canRoll(false,1,0,0)&&!canRoll(true,1,-1,0)&&!canRoll(true,1,8,0));
    assert(goldAfter(1000,20)==1500&&!goldAfter(-1,20));
    assert(goldAfter(INT32_MAX,20)==INT32_MIN+499);
    const std::array<int32_t,7> av{{INT32_MAX,2,0,0,0,0,0}},nc{{2,1,0,0,0,0,0}};
    assert(armyStrength(av,nc)==0&&enemyStrength(INT32_MAX,2)==-2);
    FormationRandom random(1);
    for(const uint32_t expected:{41U,18467U,6334U,26500U,19169U,15724U,11478U,29358U,26962U,24464U})assert(random.next()==expected);
    const std::array<double,6> thresholds{{.5,.67,1,1.5,2,3}};
    for(int i=0;i<6;++i){assert(*groups(thresholds[i],50,80)==6-i);assert(*groups(std::nextafter(thresholds[i],-INFINITY),50,80)==7-i);}
    assert(*groups(1,20,80)==3&&*groups(1,21,80)==4&&*groups(1,79,80)==4&&*groups(1,80,80)==5);
    assert(!formation(0,1,143,50));assert(!formation(-1,1,143,50));assert(!groups(INFINITY,50,80));
    for(int n=1;n<=101;++n)for(int roll=1;roll<=100;++roll)
    {
        auto f=formation(n,1,143,roll);assert(f&&f->groups>=1&&f->groups<=7&&f->groups<=n);
        assert(std::accumulate(f->counts.begin(),f->counts.end(),int64_t(0))==n);
        for(int i=0;i<7;++i)if(i<f->groups){assert(f->types[i]==143&&f->counts[i]>0);}else assert(f->types[i]==-1&&f->counts[i]==0);
    }
    for(int n:{1,2,7,80})
    {
        const auto f=formation(n,1,115,50,123,30);assert(f);const int g=std::min(n,4);assert(f->groups==g);
        for(int i=0;i<g;++i)assert(f->types[i]==(g>1&&i==g/2?123:115));
        const auto unchanged=formation(n,1,115,50,123,51);assert(unchanged);for(int i=0;i<g;++i)assert(unchanged->types[i]==115);
    }
    assert(formation(7,1,115,50,-1,50)->types[2]==-1); // raw mutable upgrade cell
}
