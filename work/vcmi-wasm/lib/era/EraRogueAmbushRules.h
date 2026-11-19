/* Source77 rule127 and the bounded original HE:T five-operand formation.
 * GPL-2.0-or-later. No native battle/visit admission is implied by this kernel. */
#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <optional>
namespace era_bridge::rogue_ambush
{
inline int32_t word(uint32_t value)
{return value<=UINT32_C(0x7fffffff)?int32_t(value):-1-int32_t(UINT32_MAX-value);}
inline constexpr std::array<int,26> objectTypes{{12,17,29,32,39,47,51,53,55,57,58,60,61,79,82,88,94,100,101,102,104,105,107,109,112,113}};
inline bool eligibleObject(int source)
{return std::find(objectTypes.begin(),objectTypes.end(),source)!=objectTypes.end();}
inline int chanceMaximum(bool timerHuman){return timerHuman?15:63;}
// mon:y is assigned only inside the original human branch. ERA clears positive
// y locals at each invocation, so the ordinary AI branch uses Pikeman0.
inline int creature(bool timerHuman,bool water){return timerHuman?(water?115:143):0;}
inline int32_t quantity(int32_t week,int32_t level)
{return word(uint32_t(week)*UINT32_C(10)+uint32_t(level)*UINT32_C(10));}
inline int32_t gold(int32_t initialQuantity)
{return word(uint32_t(initialQuantity)*UINT32_C(10)+UINT32_C(300));}
inline int32_t week(int32_t day){return (day-1)/7+1;} // admitted positive days
inline bool canRoll(bool enabled,int32_t day,int timerOwner,int32_t lastDate)
{return enabled&&day>0&&timerOwner>=0&&timerOwner<8&&day!=lastDate;}
inline int32_t armyStrength(const std::array<int32_t,7> & values,const std::array<int32_t,7> & counts)
{
    uint32_t sum=0;
    for(size_t i=0;i<values.size();++i)sum+=uint32_t(values[i])*uint32_t(counts[i]);
    return word(sum);
}
inline int32_t enemyStrength(int32_t value,int32_t count)
{return word(uint32_t(value)*uint32_t(count));}
inline std::optional<int32_t> goldAfter(int32_t previous,int32_t initialQuantity)
{
    // The original OW:R getter uses -1 as an error sentinel. Its failed
    // receiver leaves that resource unchanged; the enclosing script continues.
    if(previous==-1)return std::nullopt;
    return word(uint32_t(previous)+uint32_t(gold(initialQuantity)));
}
class FormationRandom
{
    uint32_t state;
public:
    explicit FormationRandom(uint32_t seed):state(seed){}
    uint32_t next(){state=state*UINT32_C(214013)+UINT32_C(2531011);return(state>>16)&32767U;}
    int percent(){return int(next()%100U)+1;}
    uint32_t value()const{return state;}
};
// Inputs here are the already decoded coordinate words; HE:T's packed-coordinate
// receiver and its validity checks belong to its caller, not this arithmetic.
inline uint32_t formationSeed(int32_t x,int32_t y,int32_t z)
{return uint32_t(x)*UINT32_C(248071)+uint32_t(y)*UINT32_C(276589)+uint32_t(z)*UINT32_C(310111)+UINT32_C(155303);}
inline std::optional<int> groups(double ratio,int firstPercent,int32_t count)
{
    if(!std::isfinite(ratio)||firstPercent<1||firstPercent>100||count<=0)return std::nullopt;
    int result=7;
    // Exact binary64 .67 threshold; do not substitute integer67/100 comparisons.
    for(const double threshold:{0.5,0.67,1.0,1.5,2.0,3.0})
    {if(ratio<threshold)break;--result;}
    if(firstPercent<=20)--result;
    else if(firstPercent>=80&&result<7)++result;
    return std::min<int32_t>(count,std::max(1,result));
}
struct Formation
{
    int groups=0;
    std::array<int,7> types{{-1,-1,-1,-1,-1,-1,-1}};
    std::array<int32_t,7> counts{{0,0,0,0,0,0,0}};
};
// The caller consumes the first CRT draw before applying the count cap. Only a
// proven eligible upgrade with G>1 consumes the second draw. No implicit draw.
inline std::optional<Formation> formation(int32_t count,double ratio,int type,int firstPercent,
    std::optional<int> upgrade=std::nullopt,std::optional<int> secondPercent=std::nullopt)
{
    const auto amount=groups(ratio,firstPercent,count);if(!amount)return std::nullopt;
    if(secondPercent&&(*secondPercent<1||*secondPercent>100))return std::nullopt;
    Formation result;result.groups=*amount;
    for(int i=0;i<result.groups;++i)
    {
        result.types[i]=type;result.counts[i]=count/result.groups+(i<count%result.groups?1:0);
        if(upgrade&&secondPercent&&result.groups>1&&*secondPercent<=50&&i==result.groups/2)result.types[i]=*upgrade;
    }
    return result;
}
}
