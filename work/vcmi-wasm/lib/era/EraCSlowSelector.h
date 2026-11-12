/* Original c#54 selector75BBF0; independent port, GPL-2.0-or-later. */
#pragma once
#include <algorithm>
namespace era_bridge
{
struct CSlowSnapshot
{
    int rank=0,targetSourceId=-1;
    bool actorAlive=false,targetAlive=false;
    bool orbOfInhibition=false,cursedGround=false,orbOfVulnerability=false;
    bool mirrorActive=false,alreadySlowed=false;
    int mirrorThreshold=0,heroResistance=0,creatureResistance=0;
    bool negativeExperienceImmunity=false,artifact134=false,foreignNativeRejected=false;
};
inline bool sourceCSlowExcluded(int id)
{
    //75B2FF and75BC17. No ALIVE, UNDEAD, MIND, Recanter or fire flag test.
    switch(id){case 26:case 27:case 151:case 82:case 83:case 155:case 132:case 121:return true;default:return false;}
}
inline int sourceCSlowRacialResistance(int id)
{return id==17?40:(id==16||id==133||id==196)?20:0;}
template<class Uniform> bool selectSourceCSlow(const CSlowSnapshot & s,Uniform && uniform,int * rejectionEffect=nullptr)
{
    if(rejectionEffect)*rejectionEffect=0;
    const int chance=3*std::clamp(s.rank,0,10);
    if(!chance || uniform(1,100)>chance)return false;
    if(!s.actorAlive || !s.targetAlive || s.orbOfInhibition || s.cursedGround)return false;
    if(s.targetSourceId>=160 && s.targetSourceId<=167)
    {if(rejectionEffect)*rejectionEffect=78;return false;}
    if(s.mirrorActive && uniform(1,50)<=s.mirrorThreshold)
    {if(rejectionEffect)*rejectionEffect=3;return false;}
    if((!s.orbOfVulnerability && sourceCSlowExcluded(s.targetSourceId)) || s.alreadySlowed || s.foreignNativeRejected)return false;
    (void)uniform(1,100); //75C204 sole weighted candidate still consumes one draw.
    int resistance=s.heroResistance;
    if(!s.orbOfVulnerability)
    {
        resistance+=sourceCSlowRacialResistance(s.targetSourceId)+s.creatureResistance;
        if(s.negativeExperienceImmunity)resistance=100; //71CC3B100.1f -> integer100.
    }
    if(s.artifact134)resistance=200; //75C4E9 does not consult Orb93.
    if(resistance>0 && uniform(1,100)<=resistance)
    {if(rejectionEffect)*rejectionEffect=78;return false;}
    return true;
}
}
