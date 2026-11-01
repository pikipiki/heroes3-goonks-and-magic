#pragma once
#include <array>
#include <algorithm>
namespace era_bridge
{
// h3era.exe 71D7A9 ->75B4CA, restricted to the sole c#78 row of231.
inline constexpr std::array<int,20> sourceCDispelBuffs{
    53,51,44,30,28,58,36,27,46,34,33,43,31,29,56,55,41,32,49,48};
struct CDispelSnapshot
{
    int rank=0;
    bool actorAlive=false,targetAlive=false;
    bool orbOfInhibition=false,cursedGround=false;
    int targetSourceId=-1;
    bool mirrorActive=false;
    int mirrorThreshold=0;
    //75B38E sums exactly twenty duration DWORDs. Sum!=0 is the gate.
    bool hasListedBuff=false,alreadyHasDispelHelpful=false;
    int defendingHeroResistance=0;
    bool sphereOfPermanence=false,artifact134=false;
};
template<class Uniform> bool selectSourceCDispel(const CDispelSnapshot & s,Uniform && uniform,int * rejectionEffect=nullptr)
{
    if(rejectionEffect)*rejectionEffect=0;
    const int chance=5*std::clamp(s.rank,0,10);
    if(!chance || uniform(1,100)>chance)return false; //71D8B0 BEFORE life checks.
    if(!s.actorAlive || !s.targetAlive)return false;
    if(s.orbOfInhibition || s.cursedGround)return false;
    if(s.targetSourceId>=160 && s.targetSourceId<=167)
    {if(rejectionEffect)*rejectionEffect=78;return false;}
    if(s.mirrorActive && uniform(1,50)<=s.mirrorThreshold)
    {if(rejectionEffect)*rejectionEffect=3;return false;}
    if(!s.hasListedBuff || s.alreadyHasDispelHelpful)return false;
    (void)uniform(1,100); //75C204: sole candidate weight100 still draws.
    const int resistance=s.sphereOfPermanence || s.artifact134?200:s.defendingHeroResistance;
    if(resistance>0 && uniform(1,100)<=resistance)
    {if(rejectionEffect)*rejectionEffect=78;return false;}
    return true;
}
}
