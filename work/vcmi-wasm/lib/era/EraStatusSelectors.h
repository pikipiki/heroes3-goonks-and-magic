#pragma once
#include <algorithm>
#include <cstdint>
#include <cstring>
namespace era_bridge
{
inline bool statusRollAccepts(int threshold,int roll,int maximum=100)
{
    return roll>=1 && roll<=maximum && roll<=threshold;
}
inline int sourcePoisonChance(int rank){return std::clamp(rank,0,10)*5;}
inline bool sourceCAlwaysExcludedId(int id){return id>=160 && id<=167;}
inline bool sourceCPoisonExcludedId(int id)
{
    switch(id)
    {
    case 26:case 27:case 151:case 82:case 83:case 155:case 132: //75B2FF
    case 112:case 127:case 115:case 123:case 114:case 129:case 113:case 125:
    case 120:case 121:case 182:case 191: //75B27F
    case 32:case 33:case 116:case 117: //75B357
    case 172:case 30:case 31: //75BD2F..75BD4E
        return true;
    default:return false;
    }
}
// c#75 dispatch75C0AD. Orb93 bypasses undead and these ID restrictions,
// but never the earlier global160..167, Mirror or Recanter gates.
inline bool sourceCAgeExcludedId(int id)
{
    switch(id)
    {
    case 32:case 33:case 116:case 117: //75B357 golems
    case 112:case 127:case 115:case 123:case 114:case 129:case 113:case 125:
    case 120:case 121:case 182:case 191: //75B27F elementals
    case 83:case 155:case 151:case 30:case 31: //75C0F7..75C123
        return true;
    default:return false;
    }
}
inline bool sourceCAgeEligible(bool recanters,bool orbOfVulnerability,bool undead,int eraId)
{return !recanters && (orbOfVulnerability || (!undead && !sourceCAgeExcludedId(eraId)));}
inline bool sourceCPoisonEligible(bool recanters,bool orbOfVulnerability,bool undead,int eraId)
{
    return !recanters && (orbOfVulnerability || (!undead && !sourceCPoisonExcludedId(eraId)));
}
// Exact floor(float32Acceptance * float32Aura *100) using their IEEE mantissas.
// This avoids VCMI's integer "100-resistance" rounding upward at fractional aura.
inline int sourceAccuracyPercent(float acceptance,float aura=1.0f)
{
    if(!(acceptance>0) || !(aura>0))return 0;
    acceptance=std::min(acceptance,1.0f);aura=std::min(aura,1.0f);
    uint32_t a,b;std::memcpy(&a,&acceptance,4);std::memcpy(&b,&aura,4);
    const int ea=(a>>23)&255,eb=(b>>23)&255;
    if(!ea || !eb)return 0;
    const uint64_t product=uint64_t((a&0x7fffff)|0x800000)*((b&0x7fffff)|0x800000)*100;
    const int shift=(150-ea)+(150-eb);
    return std::clamp<int>(shift>=64?0:static_cast<int>(product>>shift),0,100);
}
inline float sourceHeroResistance(int skill,int level,bool thorgrim,bool art57,bool art58,bool art59)
{
    float value=skill==1?.05f:skill==2?.10f:skill>=3?.20f:0.0f;
    if(skill>0 && thorgrim)value=static_cast<float>((1.0+double(level)*double(.05f))*double(value));
    if(art57)value=static_cast<float>(double(value)+double(.05f));
    if(art58)value=static_cast<float>(double(value)+double(.10f));
    if(art59)value=static_cast<float>(double(value)+double(.15f));
    return std::min(value,1.0f);
}
inline int sourceCHeroResistance(int skill,int level,bool thorgrim,bool art57,bool art58,bool art59)
{
    int value=skill==1?5:skill==2?10:skill>=3?20:0;
    if(thorgrim)value+=level*5*value/100;
    return value+(art57?5:0)+(art58?10:0)+(art59?15:0);
}
}
