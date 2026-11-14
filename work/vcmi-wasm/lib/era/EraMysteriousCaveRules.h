#pragma once

#include <array>
#include <cstdint>
#include <limits>
#include <stdexcept>

namespace era_bridge
{
struct CaveDailyRolls
{
 int primary=0,stat=0,experience=0,school=0,resourceArtifact=0,legionArtifact=0,tome=0;
 int resource=0,resourceAmount=0,mana=0,commanderArtifact=0,blessing=0,movement=0,remoteObject=0;
};

inline int caveSignedValue(std::uint32_t raw)
{
 if(raw<=static_cast<std::uint32_t>(std::numeric_limits<std::int32_t>::max()))return static_cast<int>(raw);
 return static_cast<int>(static_cast<std::int64_t>(raw)-0x100000000LL);
}
inline int caveSignedProduct(int a,int b)
{
 return caveSignedValue(static_cast<std::uint32_t>(a)*static_cast<std::uint32_t>(b));
}

template<class RNG> CaveDailyRolls rollCaveDaily(int day,RNG & rng)
{
 if(day<1)throw std::invalid_argument("Cave date must be positive");
 const int month=static_cast<int>((static_cast<std::int64_t>(day)+27)/28);
 CaveDailyRolls r;
 r.primary=rng(31,34);
 r.stat=caveSignedProduct(rng(1,4),month);
 r.experience=caveSignedProduct(rng(1000,5000),month); // The source overwrites this later; draw is still mandatory.
 r.school=rng(14,17);
 r.resourceArtifact=rng(109,114);
 r.legionArtifact=rng(118,122);
 r.tome=rng(86,89);if(r.tome==87)++r.tome;
 r.resource=rng(0,6);
 r.resourceAmount=caveSignedProduct(rng(10,20),month);
 r.mana=caveSignedProduct(100,month);
 r.commanderArtifact=rng(146,155);
 r.blessing=caveSignedProduct(rng(3,6),month);
 r.experience=caveSignedProduct(rng(500,2000),month);
 r.movement=caveSignedProduct(rng(1000,2000),month);
 r.remoteObject=rng(1,7);
 return r;
}

template<class RNG> int rollCaveWeekly(bool commanders,bool allOpen,bool watcher,bool allObelisksRemoved,RNG & rng)
{
 int value=rng(allOpen?20:10,commanders?64:54);
 if(watcher&&(value==44||value==45))value=43;
 if(allObelisksRemoved&&value==36)value=43;
 return value;
}

struct CaveHeroTimers
{
 int enchanted=0,speed=0,health=0,builder=0,sight=0,goldLoot=0,scourge=0;
};

inline void tickCaveHeroTimers(CaveHeroTimers & t)
{
 for(auto * value:{&t.enchanted,&t.speed,&t.health,&t.sight,&t.goldLoot})if(*value>0)--*value;
 if(t.builder>1)--t.builder;
 if(t.scourge>1)--t.scourge;
 // Caller restores portraits/hostility/specialty when these hit1, then clears.
}

inline std::array<int,4> caveRemotePrimaryBonus(int remoteType)
{
 switch(remoteType)
 {
 case 1:return {0,1,0,0};
 case 2:return {0,0,0,1};
 case 3:return {1,0,0,0};
 case 4:return {0,0,1,0};
 case 5:return {2,2,2,2};
 case 6:return {2,0,0,0};
 case 7:return {0,0,1,0};
 default:throw std::invalid_argument("Cave remote object must be1..7");
 }
}

inline int caveMageGuildMaximum(int sourceFaction)
{
 return sourceFaction==0?4:(sourceFaction==6||sourceFaction==7)?3:5;
}
inline bool caveIsTemporaryChoice(int choice)
{
 return (choice>=38&&choice<=40)||(choice>=46&&choice<=49)||(choice>=51&&choice<=54);
}
inline int caveEffectiveChoice(int choice,bool expertLogistics)
{
 if(choice==23&&expertLogistics)return 25;
 return choice;
}
}
