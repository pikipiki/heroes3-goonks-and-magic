#pragma once
#include "EraMithrilMineTiles.h"

namespace era_compat::mithril
{
inline void initializeSiteMarkers(CGameHandler & gh)
{
    initializeMineMarkers(gh);
    if(tile_properties::state(gh.gameState())["mithrilSiteVersion"].Integer()>=1)return;
    EraGameplayChange packet;
    packet.system="tileProperties";
    packet.state=tile_properties::state(gh.gameState());
    for(const auto & object:gh.gameState().getMap().getObjects())
    {
        if(!object)continue;
        const int marker=siteMarker(gh.gameInfo(),object->id);
        if(marker)tile_properties::setNumber(packet.state,object->visitablePos(),marker);
    }
    packet.state["mithrilSiteVersion"].Integer()=1;
    gh.sendAndApply(packet);
}
}
