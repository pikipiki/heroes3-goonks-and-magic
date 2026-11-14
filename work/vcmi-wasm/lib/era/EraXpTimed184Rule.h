#pragma once
#include <algorithm>
#include <array>
#include <cstdint>
#include <optional>
#include <stdexcept>
namespace era_bridge::xp184
{
inline std::int32_t signed32(std::uint32_t v){return v<0x80000000u?static_cast<std::int32_t>(v):static_cast<std::int32_t>(std::int64_t(v)-0x100000000LL);}
inline std::int32_t add(std::int32_t a,std::int32_t b){return signed32(std::uint32_t(a)+std::uint32_t(b));}
inline std::int32_t sub(std::int32_t a,std::int32_t b){return signed32(std::uint32_t(a)-std::uint32_t(b));}
inline bool supports(int id){switch(id){case 42:case 49:case 50:case 51:case 52:case 54:case 59:case 60:case 61:case 62:case 70:case 73:case 74:return true;default:return false;}}
inline bool mass(int spell,int mastery){return mastery==3&&(spell==42||spell==49||spell==50||spell==51||spell==52||spell==54||spell==61);}
inline bool positive(int spell){return spell==49||spell==51;}
struct State
{
 int spell=0,duration=0,mastery=0,magnitude=0;
 std::int32_t activeAttackLoss=0,activeDefenseLoss=0,persistentAttackLoss=0,persistentDefenseLoss=0;
 std::uint32_t generation=0;
 bool active()const{return duration!=0;}
 bool removable()const{return duration>0;}
 std::int32_t attackLoss()const{return add(activeAttackLoss,persistentAttackLoss);}
 std::int32_t defenseLoss()const{return add(activeDefenseLoss,persistentDefenseLoss);}
};
struct Change{State state;bool fresh=false,removed=false;std::optional<int> counter;};
inline Change cast(State state,int spell,int duration,int mastery,std::int32_t rawAttack,std::int32_t rawDefense,bool siege)
{
 if(!supports(spell)||mastery<0||mastery>3||(state.spell!=0&&state.spell!=spell))throw std::runtime_error("Unreviewed source XP timed state");
 state.spell=spell;
 if(spell==59)duration=255;
 if(state.duration>0){state.duration=std::max(state.duration,duration);state.mastery=std::max(state.mastery,mastery);return{state,false,false,{}};}
 state.duration=duration;state.mastery=mastery;++state.generation;
 Change result{state,true,false,{}};auto &s=result.state;
 switch(spell)
 {
  case 42:s.magnitude=mastery>=2?1:0;result.counter=41;break;
  case 49:case 50:case 51:case 52:s.magnitude=mastery>=2?2:1;break; // no mutual counters in444967..4449B3
  case 54:if(!siege){s.magnitude=mastery>=2?50:75;result.counter=53;}break;
  case 59:s.magnitude=0;result.counter=60;break;
  case 60:s.magnitude=mastery;result.counter=59;break;
  case 61:s.magnitude=mastery;break; //444D56 stores first application4C4
  case 62:{constexpr int pct[]={50,50,25,0};s.magnitude=pct[mastery];break;}
  case 70:case 74:s.magnitude=0;break;
  case 73:{const auto a=std::min<std::int32_t>(2,rawAttack),d=std::min<std::int32_t>(2,rawDefense);
   if(duration>0){s.activeAttackLoss=a;s.activeDefenseLoss=d;}
   else{s.persistentAttackLoss=add(s.persistentAttackLoss,a);s.persistentDefenseLoss=add(s.persistentDefenseLoss,d);}
   break;}
 }
 return result;
}
inline Change remove(State state)
{
 if(!state.removable())return{state,false,false,{}};
 state.duration=0;state.activeAttackLoss=0;state.activeDefenseLoss=0;return{state,false,true,{}};
}
inline Change round(State state,bool alive,bool tactics)
{
 if(!alive||tactics||state.duration<=0)return{state,false,false,{}};
 if(state.duration==1)return remove(state);
 --state.duration;return{state,false,false,{}};
}
inline std::optional<int> speed(int storedC4,const State &s,bool siege)
{
 if(s.spell!=54||!s.active())return std::nullopt;
 if(siege)return 0;
 const float fraction=static_cast<float>(s.magnitude)/100.0f;
 const float value=static_cast<float>(storedC4)*fraction;
 if(!(value>=-2147483648.0f&&value<2147483648.0f))throw std::runtime_error("Source Slow ftol outside defined domain");
 return std::max(1,static_cast<int>(value));
}
//442E86 only positive duration halves the shooter count, minimum one.
//4426D2, in contrast, treats negative duration as active for the >=2 block.
inline int forgetfulShootingCount(int count,int duration,bool shooter)
{return duration>0&&shooter?std::max(1,count/2):count;}
inline bool removeOnPhysicalHit(int spell){return spell==62||spell==70||spell==74;}
struct AttackFrame{bool rememberedBlind=false,rememberedParalyze=false,intrinsicSuppress=false;int blindRetaliationPercent=100;};
inline bool normalRetaliationAllowed(const AttackFrame &f,bool alive,int counters,bool currentStone,bool attackerBlocks,bool overrideNoReply)
{return alive&&counters>0&&!currentStone&&(!attackerBlocks||overrideNoReply)&&!f.intrinsicSuppress&&!(f.rememberedBlind&&f.blindRetaliationPercent==0);}
inline int retaliationPercent(const AttackFrame &f)
{return f.rememberedParalyze?(f.rememberedBlind?std::min(25,f.blindRetaliationPercent):25):(f.rememberedBlind?f.blindRetaliationPercent:100);}
inline bool originalMutualCounterIgnored(int incoming,int existing)
{return(incoming==49&&existing==50)||(incoming==50&&existing==49)||(incoming==51&&existing==52)||(incoming==52&&existing==51);}
inline constexpr std::array<int,14> cureOrder={42,45,50,52,54,59,60,61,62,70,71,73,74,75};
}
