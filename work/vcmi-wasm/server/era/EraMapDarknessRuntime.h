#pragma once
#include "EraSourceFogRuntime.h"
#include "../../lib/era/EraMapRulesModel.h"
namespace era_compat::map_rules
{
inline void afterHeroReveal(CGameHandler & gh,PlayerColor turnPlayer)
{
    if(!state(gh.gameInfo())["rules"]["120"].Bool())return;
    const auto * player=gh.gameInfo().getPlayerState(turnPlayer,false);
    if(!player||!player->human)return;
    const auto & map=gh.gameState().getMap();
    const int argument=era_bridge::source_fog::darknessArgument(turnPlayer.getNum(),source_fog::teams(gh));
    for(int level=0;level<map.levels();++level)
        source_fog::hide(gh,int3(map.width/2,map.height/2,level),std::max(map.width,map.height),argument);
}
}
