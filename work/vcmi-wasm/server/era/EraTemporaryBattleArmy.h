/* Replicated off-map script armies; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/mapObjectConstructors/AObjectTypeHandler.h"
#include "../../lib/mapObjectConstructors/CObjectClassesHandler.h"
#include "../../lib/mapObjects/ObjectTemplate.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
namespace era_compat::temporary_armies
{
inline ObjectInstanceID create(CGameHandler & gh,const int3 & position,
    const std::vector<std::pair<CreatureID,int32_t>> & stacks)
{
    auto & map=gh.gameState().getMap();
    if(!map.isInTheMap(position)||stacks.empty()||stacks.size()>GameConstants::ARMY_SIZE)
        throw std::runtime_error("Invalid scripted battle army");
    auto army=std::make_shared<CArmedInstance>(&gh.gameInfo());
    army->ID=Obj::EVENT;army->subID=MapObjectSubID(0);army->tempOwner=PlayerColor::NEUTRAL;
    army->id=ObjectInstanceID(map.objects.size());
    const auto handler=LIBRARY->objtypeh->getHandlerFor(Obj::EVENT,MapObjectSubID(0));
    const auto templates=handler->getTemplates(map.getTile(position).getTerrainID());
    if(templates.empty())throw std::runtime_error("Script army terrain template unavailable");
    army->appearance=templates.front();army->setAnchorPos(position+army->getVisitableOffset());
    for(size_t i=0;i<stacks.size();++i)
    {
        if(!stacks[i].first.hasValue()||stacks[i].second<=0)
            throw std::runtime_error("Invalid scripted battle stack");
        army->setCreature(SlotID(i),stacks[i].first,stacks[i].second);
    }
    TemporaryBattleArmyChange packet;packet.army=army;gh.sendAndApply(packet);
    return army->id;
}
inline void release(CGameHandler & gh,ObjectInstanceID id)
{
    TemporaryBattleArmyChange packet;packet.removedArmy=id;gh.sendAndApply(packet);
}
}
