#pragma once
#include "../CGameHandler.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/era/EraSourceFogRules.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/mapObjects/CGObjectInstance.h"

namespace era_compat::source_fog
{
inline std::array<int,8> teams(CGameHandler & gh)
{
    std::array<int,8> result;
    for(int color=0;color<8;++color)
    {
        result[color]=gh.gameState().getMap().players[color].team.getNum();
        if(const auto * player=gh.gameInfo().getPlayerState(PlayerColor(color),false))result[color]=player->team.getNum();
    }
    return result;
}
inline void hide(CGameHandler & gh,const int3 & center,int radius,int preservedPlayer)
{
    const auto & map=gh.gameState().getMap();
    if(!map.isInTheMap(center)||radius<0||radius>4096)throw std::runtime_error("Invalid original fog area");
    const auto keep=era_bridge::source_fog::preservedPlayers(preservedPlayer,teams(gh));
    FowTilesType area;
    for(int x=std::max<int64_t>(0,int64_t(center.x)-radius);x<=std::min<int64_t>(map.width-1,int64_t(center.x)+radius);++x)
        for(int y=std::max<int64_t>(0,int64_t(center.y)-radius);y<=std::min<int64_t>(map.height-1,int64_t(center.y)+radius);++y)
            if(era_bridge::source_fog::includes(x-center.x,y-center.y,radius))area.insert(int3(x,y,center.z));
    std::set<TeamID> seen;
    for(int color=0;color<8;++color)
    {
        const PlayerColor owner(color);const auto * player=gh.gameInfo().getPlayerState(owner,false);
        if(!player||!seen.insert(player->team).second)continue;
        if(!(keep&(1u<<color)))gh.changeFogOfWar(area,owner,ETileVisibility::HIDDEN);
    }
    // Native hidden-fog packets restore sight in their affected team. Original
    // UN:H also refreshes all other owners, including on the other map level.
    for(int color=0;color<8;++color)
    {
        const PlayerColor owner(color);const auto * player=gh.gameInfo().getPlayerState(owner,false);
        if(!player)continue;
        FowTilesType observed;
        for(const auto * object:player->getOwnedObjects())
            gh.gameInfo().getTilesInRange(observed,object->getSightCenter(),object->getSightRadius(),ETileVisibility::HIDDEN,owner);
        gh.changeFogOfWar(observed,owner,ETileVisibility::REVEALED);
    }
}
}
