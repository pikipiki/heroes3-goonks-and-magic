#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraMapRulesModel.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/TerrainHandler.h"
#include "../../lib/mapObjectConstructors/AObjectTypeHandler.h"

namespace era_compat::map_rules
{
inline void initializeSettings(CGameHandler & gh,bool firstTurn)
{
    if(state(gh.gameInfo()).isStruct())return;
    const auto path=JsonPath::builtin("config/wog-map-rules");
    JsonNode configured;
    if(firstTurn&&CResourceHandler::get()->existsResource(path))configured=JsonNode(path)["mapRules"];
    EraGameplayChange packet;packet.system="mapRules";
    packet.state["rules"]["114"].Bool()=configured["114"].Bool();
    packet.state["rules"]["122"].Bool()=configured["122"].Bool();
    packet.state["rules"]["124"].Bool()=configured["124"].Bool();
    gh.sendAndApply(packet);
}
inline void changeWeeklyMines(CGameHandler & gh)
{
    const auto & cb=gh.gameInfo();const int day=cb.getDate(Date::DAY);
    if(!weeklyMines(cb)||day<=1||(day-1)%7)return;
    auto enhancements=mithril::state(cb);bool protectionUsed=false;
    for(const auto * mine:cb.gameState().getMap().getObjects<CGMine>())
    {
        if(mine->ID!=Obj::MINE)continue;
        auto & saved=enhancements["objects"][std::to_string(mine->id.getNum())];
        if(mithril::enabled(cb)&&saved["mineProtected"].Bool())
        {
            saved["mineProtected"].Bool()=false;protectionUsed=true;continue;
        }
        gh.setObjPropertyID(mine->id,ObjProperty::ERA_MINE_RESOURCE,NumericID(gh.getRandomGenerator().nextInt(0,6)));
    }
    if(protectionUsed)
    {
        enhancements["revision"].Integer()+=1;
        EraGameplayChange packet;packet.system="mithril";packet.state=std::move(enhancements);gh.sendAndApply(packet);
    }
}
inline void placeDailyPlains(CGameHandler & gh,PlayerColor player)
{
    const auto & cb=gh.gameInfo();
    if(!dailyPlains(cb)||cb.getDate(Date::DAY)<=1)return;
    for(const auto id:cb.gameState().getMap().getHeroesOnMap())
    {
        const auto * hero=cb.getHero(id);
        if(!hero||hero->getOwner()!=player||hero->visitablePos().z!=0)continue;
        const auto position=hero->visitablePos()+int3(2,1,0);
        if(!cb.isInTheMap(position))continue;
        const auto * tile=cb.getTile(position);
        if(tile->blocked()||tile->visitable()||tile->isWater()||!tile->getTerrain()->isPassable())continue;
        auto plains=gh.createNewObject(position,MapObjectID(46),MapObjectSubID(0));
        // UN:I's sixth argument selects the source surface template.
        const auto dirt=plains->getObjectHandler()->getTemplates(ETerrainId::DIRT);
        if(!dirt.empty())plains->appearance=dirt.front();
        plains->setAnchorPos(position);gh.newObject(plains,hero->getOwner());
    }
}
inline void onNewDay(CGameHandler & gh)
{changeWeeklyMines(gh);}
}
