#pragma once
#include "EraPrimordialCastRuntime.h"
namespace era_compat_server {
inline void dwellingAfterShot(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor,const CStack * target)
{
 if(!actor||!target||!target->alive()||!era_compat::DwellingServices::get().actor(284,actor->unitType()->getJsonKey()))return;
 // tables.cpp z_Hook_after_shot10496..10510, default action-mastery2
 // enters the existing WoG directkind1 envelope (native expert3/current power).
 if(target->unitSide()==era_compat::confluxActiveSide(battle))return;
 primordialDirectEventCast(handler,battle,actor,target,54,true);
}
}
