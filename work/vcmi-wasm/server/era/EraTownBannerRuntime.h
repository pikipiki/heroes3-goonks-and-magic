#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraTownBannerRules.h"
#include "../../lib/era/EraMapRulesModel.h"
#include "../../lib/era/EraTileProperties.h"
#include "../../lib/era/EraWogOptions.h"
#include "../../lib/StartInfo.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/mapObjects/ObjectTemplate.h"
#include "../../lib/TerrainHandler.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/mapObjects/army/CStackInstance.h"
#include "../../lib/entities/faction/CFaction.h"
#include "../../lib/entities/faction/CTown.h"
#include "../../lib/mapObjectConstructors/AObjectTypeHandler.h"
#include "../../lib/mapObjectConstructors/CObjectClassesHandler.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/mapObjects/MiscObjects.h"
#include "../../lib/mapping/MapFormatSettings.h"
#include "../../lib/mapping/MapIdentifiersH3M.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
namespace era_compat::town_banners
{
inline ArtifactID banner()
{return ArtifactID(ArtifactID::decode("wake-of-gods.stackartifacts:warlordsBannerHealth"));}
inline bool isBanner(ArtifactID id)
{
    if(!id.hasValue())return false;
    const auto & key=id.toArtifact()->getJsonKey();
    for(const auto * suffix:{"Health","Attack","Defence","Damage","Speed","Experience","Reducer","Blocker","Retaliate"})
        if(key==std::string("wake-of-gods.stackartifacts:warlordsBanner")+suffix)return true;
    return false;
}
inline int sourceFaction(const CGTownInstance & town)
{
    const auto & key=town.getFactionID().toFaction()->getJsonKey();
    for(int i=0;i<9;++i)if(key==era_bridge::wogTownFactions[i])return i;
    return -1;
}
inline bool accessible(CGameHandler & gh,const std::array<int,3> & candidate)
{
    const int3 pos(candidate[0],candidate[1],candidate[2]);const auto & map=gh.gameState().getMap();
    // Invalid original probe coordinates are clamped by the old executable,
    // but insertion still uses its original coordinates. Never insert outside
    // the native map; unsupported edge probes are safely unavailable.
    if(!map.isInTheMap(pos))return false;
    const auto & tile=map.getTile(pos);
    if(tile.visitable()||tile.blocked()||tile.isWater()||!tile.getTerrain()->isPassable())return false;
    for(const auto & object:map.objects)
        if(object&&object->ID==Obj::EVENT&&object->visitablePos()==pos)return false;
    return true;
}
inline void persist(CGameHandler & gh,JsonNode next)
{EraGameplayChange packet;packet.system="mapRules";packet.state=std::move(next);gh.sendAndApply(packet);}
inline void place(CGameHandler & gh)
{
    auto saved=map_rules::state(gh.gameInfo());
    if(!saved["rules"]["239"].Bool()||saved["bannersPlaced"].Bool())return;
    const auto id=banner();if(!id.hasValue())throw std::runtime_error("Original town banner prototype is unavailable");
    const int difficulty=static_cast<int>(gh.gameInfo().getStartInfo()->getDifficulty());
    const auto & map=gh.gameState().getMap();
    // The native object vector retains map town order. CA:P is the town's
    // interactive tile; no fixed DEF anchor offset applies across templates.
    for(const auto * town:map.getObjects<CGTownInstance>())
    {
        const int faction=sourceFaction(*town);if(faction<0)continue;
        const auto start=town->visitablePos();
        const auto target=era_bridge::town_banners::placement(start.x,start.y,start.z,map.height,
            [&](const auto & candidate){return accessible(gh,candidate);});
        if(!target)continue;
        const auto guard=era_bridge::town_banners::guardian(faction,difficulty);
        CreatureID creature=CreatureID::NONE;
        if(guard.fixedSource>=0)creature=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(CreatureID(guard.fixedSource));
        else
        {
            const auto & rows=town->getTown()->creatures;
            if(rows.size()<=std::size_t(guard.tier)||rows[guard.tier].size()<=std::size_t(guard.upgraded))
                throw std::runtime_error("Original town banner guardian row is unavailable");
            creature=rows[guard.tier][guard.upgraded?1:0];
        }
        if(!creature.hasValue()||!creature.toCreature())throw std::runtime_error("Original town banner guardian is unavailable");
        const auto handler=LIBRARY->objtypeh->getHandlerFor(Obj::ARTIFACT,MapObjectSubID(id.getNum()));
        auto templates=LIBRARY->objtypeh->getOriginalTemplates(Obj::ARTIFACT,MapObjectSubID(id.getNum()));
        const bool original=!templates.empty();if(!original)templates=handler->getTemplates();
        const auto dirt=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(TerrainId(0));
        templates.erase(std::remove_if(templates.begin(),templates.end(),[&](const auto & item){return !item->canBePlacedAt(dirt);}),templates.end());
        if(templates.empty())throw std::runtime_error("Original town banner appearance is unavailable");
        auto created=handler->create(&gh.gameInfo(),nullptr);handler->configureObject(created.get(),*gh.randomizer);
        gh.gs->getMap().generateUniqueInstanceName(created.get());created->appearance=original?templates.back():templates.front();
        created->setAnchorPos(int3((*target)[0],(*target)[1],(*target)[2]));
        if(created->visitablePos()!=created->anchorPos())throw std::runtime_error("Original town banner footprint is unsupported");
        auto artifact=std::dynamic_pointer_cast<CGArtifact>(created);
        if(!artifact)throw std::runtime_error("Original town banner object handler is unavailable");
        const auto initial=era_bridge::town_banners::initialGuard(town->getOwner().isValidPlayer());
        artifact->clearSlots();
        if(initial.enabled)artifact->putStack(SlotID(0),std::make_unique<CStackInstance>(&gh.gameInfo(),creature,initial.count));
        gh.newObject(created,PlayerColor::NEUTRAL);
        auto & record=saved["bannerGuards"][std::to_string(created->id.getNum())];
        record["creature"].String()=CreatureID::encode(creature.getNum());record["count"].Integer()=initial.count;record["enabled"].Bool()=initial.enabled;
        if(town->getOwner().isValidPlayer())
        {
            EraGameplayChange tiles;tiles.system="tileProperties";tiles.state=tile_properties::state(gh.gameState());
            tile_properties::setOwner(tiles.state,created->visitablePos(),town->getOwner().getNum());gh.sendAndApply(tiles);
        }
    }
    saved["bannersPlaced"].Bool()=true;persist(gh,std::move(saved));
}
inline void grow(CGameHandler & gh)
{
    auto saved=map_rules::state(gh.gameInfo());const int day=gh.gameInfo().getDate(Date::DAY);
    if(!saved["rules"]["239"].Bool()||!era_bridge::town_banners::grows(day,static_cast<int>(gh.gameInfo().getStartInfo()->getDifficulty()))
        ||saved["bannerGrowthDay"].Integer()==day)return;
    for(const auto * artifact:gh.gameState().getMap().getObjects<CGArtifact>())
    {
        if(artifact->ID!=Obj::ARTIFACT||!isBanner(artifact->getArtifactType()))continue;
        auto & record=saved["bannerGuards"][std::to_string(artifact->id.getNum())];
        const auto * stack=artifact->getStackPtr(SlotID(0));
        const bool extended=record.isStruct()||stack;
        if(!era_bridge::town_banners::eligibleForGrowth(tile_properties::owner(gh.gameState(),artifact->visitablePos()),extended))continue;
        const int64_t count=stack?stack->getCount():record.isStruct()&&!record["enabled"].Bool()?record["count"].Integer():0;
        const CreatureID creature=stack?stack->getId():record.isStruct()?CreatureID(CreatureID::decode(record["creature"].String())):CreatureID::NONE;
        // Original empty typed slots and overflowing signed counts are not
        // representable by a native army; leave them unchanged.
        if(!creature.hasValue()||count<0||count>=INT32_MAX)continue;
        const StackLocation location(artifact->id,SlotID(0));
        const bool changed=stack?gh.changeStackCount(location,1,ChangeValueMode::RELATIVE):gh.insertNewStack(location,creature.toCreature(),count+1);
        if(!changed)throw std::runtime_error("Original town banner guardian growth failed");
        record["creature"].String()=CreatureID::encode(creature.getNum());record["count"].Integer()=count+1;record["enabled"].Bool()=true;
    }
    saved["bannerGrowthDay"].Integer()=day;persist(gh,std::move(saved));
}
inline void onNewDay(CGameHandler & gh){place(gh);grow(gh);}
}
