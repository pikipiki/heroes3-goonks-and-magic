#pragma once
#include "../../lib/era/EraDwellingServices.h"
namespace era_compat_server {
inline int dwellingIntrinsicStatus(const CStack*actor){
 if(!actor)return -1;const auto&key=actor->unitType()->getJsonKey();
 for(const auto&entry:std::array<std::pair<int,int>,7>{{{285,74},{305,73},{310,71},{312,70},{335,71},{336,71},{360,42}}})
  if(era_compat::DwellingServices::get().actor(entry.first,key))return entry.second;
 return -1;
}
inline bool selectDwellingIntrinsicStatus(CGameHandler&handler,const CBattleInfoCallback&battle,const CStack*actor,const CStack*target,int spell){
 if(spell!=73&&spell!=71&&spell!=70&&spell!=42&&spell!=74)throw std::runtime_error("Unknown dwelling intrinsic selector");
 //4402B8/44053A test the source ALIVE flag before the proc lottery; Curse
 //440422 and Stone440496 draw first. Target life is checked after that draw.
 if((spell==73||spell==71)&&(!target||!statusLiving(target)))return false;
 const int chance=spell==71?30:spell==42?25:20;
 if(!era_bridge::statusRollAccepts(chance,handler.getRandomGenerator().nextInt(1,100)))return false;
 if(!target||!target->alive())return false;
 return statusPrimaryAccepts(handler,battle,actor,target,SpellID(spell),spell==71||spell==73);
}
}
