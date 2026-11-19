#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraWogOptions.h"
#include "../../lib/era/EraMapArmyGrowth.h"
#include "../../lib/era/EraMapCreatureRules.h"
#include "../../lib/era/EraMapInvertedSpeed.h"
#include "../../lib/era/EraMapFortlessRules.h"
#include "../../lib/era/EraTileProperties.h"
#include "../../lib/mapObjects/MiscObjects.h"
#include "../../lib/era/EraMapMonthlyVisitRules.h"
#include "../../lib/era/EraMapExtraDwellingRules.h"
#include "../../lib/era/EraSourceCreatureLevels.h"
#include "../../lib/mapObjects/CGDwelling.h"
#include "../../lib/StartInfo.h"
#include "../../lib/era/EraMapRulesModel.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/TerrainHandler.h"
#include "../../lib/mapObjectConstructors/AObjectTypeHandler.h"
#include "../../lib/mapObjects/CGTownInstance.h"
#include "../../lib/entities/building/CBuilding.h"

namespace era_compat::map_rules
{
inline void initializeSettings(CGameHandler & gh,bool firstTurn)
{
    if(state(gh.gameInfo()).isStruct())return;
    const auto path=JsonPath::builtin("config/wog-map-rules");
    JsonNode configured;
    if(firstTurn&&CResourceHandler::get()->existsResource(path))configured=JsonNode(path)["mapRules"];
    EraGameplayChange packet;packet.system="mapRules";
    const auto choice=[&](const char * code,era_bridge::WogOption option)
    {
        // Legacy saves without a frozen rule record retain the old baseline.
        packet.state["rules"][code].Bool()=firstTurn&&era_bridge::wogOptionEnabled(
            gh.gameInfo(),option,configured[code].Bool());
    };
    choice("111",era_bridge::WogOption::GroundedFliers);
    choice("112",era_bridge::WogOption::InvertedCreatureSpeeds);
    choice("114",era_bridge::WogOption::DailyMagicPlains);
    choice("115",era_bridge::WogOption::AllDoubleAttack);
    choice("121",era_bridge::WogOption::DoubleMovement);
    choice("122",era_bridge::WogOption::WeeklyMineResources);
    choice("124",era_bridge::WogOption::MultipleCapitols);
    choice("128",era_bridge::WogOption::AllBreath);
    choice("116",era_bridge::WogOption::DailyArmyGrowth);
    choice("130",era_bridge::WogOption::TownGrails);
    choice("123",era_bridge::WogOption::MonthlyVisits);
    choice("117",era_bridge::WogOption::ExtraDwellingCreatures);
    choice("131",era_bridge::WogOption::TownsWithoutForts);
    choice("119",era_bridge::WogOption::DoubleArtifacts);
    packet.state["sourceOptions"]["144"].Bool()=firstTurn&&era_bridge::wogOptionEnabled(
        gh.gameInfo(),era_bridge::WogOption::PreserveAiForts,configured["sourceOptions"]["144"].Bool());
    packet.state["sourceOptions"]["67"].Bool()=firstTurn&&configured["sourceOptions"]["67"].Bool();
    // The original menu removes rule130 when ANY Conflux exists, including
    // neutral/enemy towns. Never enable Aurora Borealis through this rule.
    for(const auto * town:gh.gameState().getMap().getObjects<CGTownInstance>())
        if(town->getFactionID()==FactionID::CONFLUX)
            packet.state["rules"]["130"].Bool()=false;
    gh.sendAndApply(packet);
}
inline void markInitialArtifacts(CGameHandler & gh)
{
    auto saved=state(gh.gameInfo());
    if(!saved["rules"]["119"].Bool()||saved["artifactsMarked"].Bool())return;
    EraGameplayChange tiles;tiles.system="tileProperties";
    tiles.state=tile_properties::state(gh.gameState());
    // N15 is a coordinate marker, including guarded original artifacts.
    // Scrolls and artifacts created after this one-time pass are not marked.
    for(const auto * artifact:gh.gameState().getMap().getObjects<CGArtifact>())
        if(artifact->ID==Obj::ARTIFACT)
            tile_properties::setNumber(tiles.state,artifact->visitablePos(),15);
    if(tiles.state.isStruct())gh.sendAndApply(tiles);
    saved["artifactsMarked"].Bool()=true;
    EraGameplayChange packet;packet.system="mapRules";packet.state=std::move(saved);gh.sendAndApply(packet);
}
inline void removeInitialFortifications(CGameHandler & gh,bool firstTurn)
{
    auto saved=state(gh.gameInfo());
    if(!firstTurn||!saved["rules"]["131"].Bool()||saved["fortlessApplied"].Bool())return;
    const bool preserveAi=saved["sourceOptions"]["144"].Bool();
    for(const auto * town:gh.gameState().getMap().getObjects<CGTownInstance>())
    {
        const auto owner=town->getOwner();
        const auto * player=owner.isValidPlayer()?gh.gameInfo().getPlayerState(owner):nullptr;
        if(era_bridge::map_rules::removeInitialFortifications(true,preserveAi,owner.isValidPlayer(),player&&player->isHuman()))
            saved["fortlessTowns"].Vector().emplace_back(town->id.getNum());
    }
    saved["fortlessApplied"].Bool()=true;
    EraGameplayChange packet;packet.system="mapRules";packet.state=std::move(saved);gh.sendAndApply(packet);
}
inline void buildTownGrails(CGameHandler & gh)
{
    auto saved=state(gh.gameInfo());
    if(!saved["rules"]["130"].Bool()||saved["grailsApplied"].Bool())return;
    // Run after the first NewTurn packet, matching the source day-one
    // timer, not during initial stock/income generation. Existing Grails
    // stay intact, and later town construction/capture must not replay it.
    for(const auto * town:gh.gameState().getMap().getObjects<CGTownInstance>())
        if(town->getTown()->buildings.count(BuildingID::GRAIL)&&!town->hasBuilt(BuildingID::GRAIL))
            gh.buildStructure(town->id,BuildingID::GRAIL,true);
    saved["grailsApplied"].Bool()=true;
    EraGameplayChange packet;packet.system="mapRules";packet.state=std::move(saved);gh.sendAndApply(packet);
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
inline void growHeroArmies(CGameHandler & gh)
{
    const auto & saved=state(gh.gameInfo());const auto day=gh.gameInfo().getDate(Date::DAY);
    if(!saved["rules"]["116"].Bool()||day<=1||saved["armyGrowthDay"].Integer()>=day)return;
    EraGameplayChange packet;packet.system="mapRules";packet.state=saved;
    packet.state["armyGrowthDay"].Integer()=day;
    packet.state["armyGrowth"].Vector().clear();
    const auto heroes=sourceArmyHeroes(gh.gameState().getMap());
    for(int id=0;id<156;++id)
        if(const auto * hero=heroes[id])
            for(int slot=0;slot<7;++slot)
                if(hero->hasStackAtSlot(SlotID(slot)))
                {
                    const auto old=hero->getStackCount(SlotID(slot));
                    const auto count=era_bridge::map_rules::dailyArmyCount(old);
                    if(count<=old)continue;
                    JsonNode row;row["hero"].Integer()=id;row["slot"].Integer()=slot;
                    row["before"].Integer()=old;row["count"].Integer()=count;
                    packet.state["armyGrowth"].Vector().push_back(std::move(row));
                }
    gh.sendAndApply(packet);
}
inline void resetMonthlyVisits(CGameHandler & gh)
{
    const auto & saved=state(gh.gameInfo());const auto day=gh.gameInfo().getDate(Date::DAY);
    if(!saved["rules"]["123"].Bool()||!era_bridge::map_rules::monthlyVisitDay(day)
        ||saved["visitsResetDay"].Integer()>=day)return;
    EraGameplayChange packet;packet.system="mapRules";packet.state=saved;
    packet.state["visitsResetDay"].Integer()=day;gh.sendAndApply(packet);
}
inline void addExtraDwellingCreatures(CGameHandler & gh)
{
    auto saved=state(gh.gameInfo());
    if(!saved["rules"]["117"].Bool()||saved["extraDwellingApplied"].Bool())return;
    const bool neutralTown=saved["sourceOptions"]["67"].Bool();
    const CreatureID added(CreatureID::decode(neutralTown?"core:airElemental":"core:boar"));
    if(!added.toCreature())throw std::runtime_error("Missing WoG extra dwelling creature");
    for(const auto * dwelling:gh.gameState().getMap().getObjects<CGDwelling>())
    {
        if(dwelling->ID!=Obj::CREATURE_GENERATOR1||dwelling->creatures.empty()
            ||dwelling->creatures.front().second.empty())continue;
        const auto * first=dwelling->creatures.front().second.front().toCreature();
        const auto source=era_bridge::sourceCreatureIdForLevel(first->getJsonKey());
        const auto level=era_bridge::sourceCreatureLevelForKey(first->getJsonKey());
        if(!source||!level||!era_bridge::map_rules::extraDwellingCreature(
            dwelling->ID.getNum(),*source,*level))continue;
        SetAvailableCreatures stock;stock.tid=dwelling->id;stock.creatures=dwelling->creatures;
        if(stock.creatures.size()<2)stock.creatures.resize(2);
        stock.creatures[1]={era_bridge::map_rules::extraDwellingInitialStock,{added}};
        gh.sendAndApply(stock);
        saved["extraDwellingObjects"][std::to_string(dwelling->id.getNum())].Bool()=true;
    }
    saved["extraDwellingApplied"].Bool()=true;
    EraGameplayChange packet;packet.system="mapRules";packet.state=std::move(saved);gh.sendAndApply(packet);
}
inline void groundFliers(CGameHandler & gh)
{
    auto saved=state(gh.gameInfo());
    if(!saved["rules"]["111"].Bool()||saved["groundedFliersApplied"].Bool())return;
    saved["groundedFliers"].Vector().clear();
    LIBRARY->creatures()->forEach([&](const Creature * entry,bool &)
    {
        const auto * creature=entry->getId().toCreature();
        if(excludedCreature(creature->getJsonKey())||flightAlreadyDisabled(gh.gameState(),creature->getId())
            ||!creature->hasBonus(Selector::type()(BonusType::FLYING)
                .And(Selector::sourceTypeSel(BonusSource::CREATURE_ABILITY))))return;
        JsonNode row;row.Integer()=creature->getId().getNum();
        saved["groundedFliers"].Vector().push_back(std::move(row));
    });
    saved["groundedFliersApplied"].Bool()=true;
    EraGameplayChange packet;packet.system="mapRules";packet.state=std::move(saved);gh.sendAndApply(packet);
}
inline void invertCreatureSpeeds(CGameHandler & gh)
{
    auto saved=state(gh.gameInfo());
    if(!saved["rules"]["112"].Bool()||saved["invertedSpeedsApplied"].Bool())return;
    std::vector<std::pair<CreatureID,int>> initial;int maximum=0;
    LIBRARY->creatures()->forEach([&](const Creature * entry,bool &)
    {
        if(excludedCreature(entry->getJsonKey()))return;
        const auto id=entry->getId();const auto speed=era_campaign_creature_attributes::current(gh.gameState(),id,'S');
        initial.emplace_back(id,speed);maximum=std::max(maximum,speed);
    });
    saved["invertedSpeeds"].Vector().clear();
    for(const auto & [id,speed]:initial)
    {
        JsonNode row;row["creature"].Integer()=id.getNum();
        row["speed"].Integer()=era_bridge::map_rules::invertedSpeed(maximum,speed);
        saved["invertedSpeeds"].Vector().push_back(std::move(row));
    }
    saved["invertedSpeedsApplied"].Bool()=true;
    EraGameplayChange packet;packet.system="mapRules";packet.state=std::move(saved);gh.sendAndApply(packet);
}
inline void onNewDay(CGameHandler & gh)
{buildTownGrails(gh);changeWeeklyMines(gh);growHeroArmies(gh);resetMonthlyVisits(gh);}
}
