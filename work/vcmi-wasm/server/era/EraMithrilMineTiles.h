#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"

namespace era_compat::mithril
{
inline void initializeMineMarkers(CGameHandler & gh)
{
    if(tile_properties::state(gh.gameState())["mithrilMineVersion"].Integer()>=1)return;
    EraGameplayChange packet;
    packet.system="tileProperties";
    packet.state=tile_properties::state(gh.gameState());
    for(const auto * mine:gh.gameState().getMap().getObjects<CGMine>())
    {
        if(mine->ID!=Obj::MINE)continue;
        const auto position=mine->visitablePos();
        // Preserve existing shared marks when importing the former adapter.
        const int marker=mineMarker(gh.gameInfo(),mine->id);
        if(marker)tile_properties::setNumber(packet.state,position,marker);
    }
    packet.state["mithrilMineVersion"].Integer()=1;
    gh.sendAndApply(packet);
}
inline void decrementMineMarkers(CGameHandler & gh)
{
    const auto & cb=gh.gameInfo();
    if(!enabled(cb)||map_rules::weeklyMines(cb)||cb.getDate(Date::DAY)<=1)return;
    initializeMineMarkers(gh);
    EraGameplayChange packet;
    packet.system="tileProperties";
    packet.state=tile_properties::state(gh.gameState());
    bool changed=false;
    for(const auto * mine:gh.gameState().getMap().getObjects<CGMine>())
    {
        if(mine->ID!=Obj::MINE)continue;
        const auto position=mine->visitablePos();
        const int marker=tile_properties::number(gh.gameState(),position);
        if(!marker)continue;
        tile_properties::setNumber(packet.state,position,era_bridge::mithril::nextMineMarker(marker));
        changed=true;
    }
    if(changed)gh.sendAndApply(packet);
}
}
