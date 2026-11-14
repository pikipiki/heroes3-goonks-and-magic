/* Original75C979 ->75B4CA whole Sorceress selector. GPL-2.0-or-later. */
#pragma once
#include <array>
#include <cstdint>
#include <vector>
namespace era_bridge
{
struct SorceressCandidate{int spell,weight;};
inline std::vector<SorceressCandidate> sorceressPool(int count)
{
    if(count>=50)return{{60,4},{62,4},{59,4},{75,4},{71,11},{50,11},{80,11},{61,11},{54,8},{42,8},{78,8},{52,4},{47,4},{73,4},{45,4}};
    if(count>=20)return{{71,15},{50,15},{80,15},{61,15},{54,8},{42,8},{78,8},{52,4},{47,4},{73,4},{45,4}};
    if(count>=10)return{{54,20},{42,20},{78,20},{52,10},{47,10},{73,10},{45,10}};
    return{{52,25},{47,25},{73,25},{45,25}};
}
inline bool sorceressElemental(int id)
{switch(id){case 112:case 127:case 115:case 123:case 114:case 129:case 113:case 125:case 120:case 121:case 182:case 191:return true;default:return false;}}
inline bool sorceressDragon(int id)
{switch(id){case 26:case 27:case 151:case 82:case 83:case 155:case 132:return true;default:return false;}}
inline bool sorceressGolem(int id)
{return id==32||id==33||id==116||id==117;}
struct SorceressSnapshot
{
    int count=0,targetSourceId=-1,shots=0,mirrorThreshold=0,heroResistance=0;
    bool targetPresent=false,orbInhibition=false,cursedGround=false,recanter=false,orbVulnerability=false;
    bool undead=false,noMorale=false,mindImmune=false,fireImmune=false,shooter=false;
    bool mirrorActive=false,hasListedBuff=false,artifact134=false;
    std::array<bool,81> alreadyActive{},foreignRejected{},pendantReject{},xpImmune{};
    std::array<int,81> xpResistance{};
};
inline bool sorceressEligible(const SorceressSnapshot & s,int spell)
{
    const int id=s.targetSourceId;
    if(s.alreadyActive[spell])return false;
    // These checks precede Orb93 in the original per-spell dispatch.
    if((spell==50||spell==59||spell==60||spell==61||spell==71||spell==73||spell==75||spell==80)&&s.recanter)return false;
    if(spell==50&&s.noMorale)return false;
    if(spell==61&&(!s.shooter||s.shots<=0))return false;
    if(spell==78)return s.hasListedBuff;
    if(s.orbVulnerability)return true;
    if(s.foreignRejected[spell])return false;
    const bool dragon=sorceressDragon(id),elemental=sorceressElemental(id),golem=sorceressGolem(id);
    switch(spell)
    {
    case 42:return !s.undead&&!dragon&&id!=121&&!s.fireImmune;
    case 45:case 47:case 54:return !dragon&&id!=121;
    case 52:return !dragon&&id!=121&&!s.fireImmune;
    case 50:return !s.undead&&!s.mindImmune&&id!=83&&id!=155&&id!=27&&id!=151;
    case 59:return !s.undead&&!golem&&!elemental&&!s.mindImmune&&!s.fireImmune&&id!=27&&id!=151&&id!=83&&id!=155&&id!=132;
    case 60:return !s.undead&&!golem&&!elemental&&!s.mindImmune&&!dragon;
    case 61:return !s.mindImmune&&!s.undead;
    case 62:return !s.undead&&!golem&&!elemental&&!s.mindImmune&&!dragon&&!s.fireImmune&&id!=70&&id!=71;
    case 71:case 73:return !dragon&&!s.undead&&!elemental&&!golem&&id!=172&&id!=30&&id!=31;
    case 75:return !s.undead&&!golem&&!elemental&&id!=83&&id!=155&&id!=151&&id!=30&&id!=31;
    case 80:return id!=121&&id!=83&&id!=155&&id!=151;
    default:return false;
    }
}
template<class Uniform> int selectSorceress(const SorceressSnapshot & s,Uniform && uniform,int * rejection=nullptr)
{
    if(rejection)*rejection=0;
    if(!s.targetPresent||s.count<=0)return -1;
    // Explicit Win32 wrap avoids C++ signed overflow for exceptional counts.
    const uint32_t word=20u+uint32_t(s.count)*2u;
    const int64_t chance=word<=0x7fffffffu?int64_t(word):int64_t(word)-0x100000000LL;
    if(uniform(1,100)>chance)return -1;
    if(s.orbInhibition||s.cursedGround)return -1;
    if(s.targetSourceId>=160&&s.targetSourceId<=167){if(rejection)*rejection=78;return -1;}
    if(s.mirrorActive&&uniform(1,50)<=s.mirrorThreshold){if(rejection)*rejection=3;return -1;}
    auto pool=sorceressPool(s.count);int total=0;
    for(auto & c:pool){if(!sorceressEligible(s,c.spell))c.weight=0;total+=c.weight;}
    if(total==0)return -1;
    int draw=uniform(1,total),selected=-1;
    for(const auto & c:pool){if(!c.weight)continue;draw-=c.weight;if(draw<=0){selected=c.spell;break;}}
    int resistance=s.heroResistance;
    if(selected!=71&&selected!=75&&selected!=78&&selected!=80&&!s.orbVulnerability)
    {
        const int racial=s.targetSourceId==17?40:(s.targetSourceId==16||s.targetSourceId==133||s.targetSourceId==196)?20:0;
        resistance+=racial+s.xpResistance[selected];
        if(s.xpImmune[selected])resistance=100;
    }
    if(s.pendantReject[selected]||(s.artifact134&&selected!=75))resistance=200;
    if(resistance>0&&uniform(1,100)<=resistance){if(rejection)*rejection=78;return -1;}
    return selected;
}
}
