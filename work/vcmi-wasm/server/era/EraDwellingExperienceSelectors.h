#pragma once
#include "EraCDispelRuntime.h"
#include "EraCSlowRuntime.h"
#include "../../lib/era/EraDwellingServices.h"
#include "../../lib/IGameSettings.h"
namespace era_compat_server {
inline int selectDwellingExperienceSpell(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor,const CStack * target)
{
 if(!actor||actor->unitSlot()==SlotID::COMMANDER_SLOT_PLACEHOLDER||!handler.gameInfo().getSettings().getBoolean(EGameSettings::MODULE_STACK_EXPERIENCE))return -1;const auto key=actor->unitType()->getJsonKey();int source=-1;
 for(const int id:{274,276,282,284,325,326,327,335,336})if(era_compat::DwellingServices::get().actor(id,key)){source=id;break;}
 if(source<0)return -1;const int rank=std::clamp(statusRank(actor),0,10);
 const int spell=source==274||source==282?78:source==284?54:source==325?75:71;
 int chance=source==284?100:rank*(source==325?8:5);
 if(source==335){constexpr int curve[]{0,5,10,15,20,25,35,45,55,65,75};chance=curve[rank];}
 if(source==336){constexpr int curve[]{5,10,20,30,40,50,60,70,80,90,100};chance=curve[rank];}
 const bool selected=spell==78?selectSourceCDispel(handler,battle,actor,target,chance):spell==54?selectSourceCSlow(handler,battle,actor,target,chance):selectSourceCStatus(handler,battle,actor,target,spell,chance);
 return selected?spell:-1;
}
}
