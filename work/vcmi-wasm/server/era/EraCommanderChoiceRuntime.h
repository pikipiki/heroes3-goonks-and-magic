#pragma once
#include "../CGameHandler.h"
#include "EraSourceArtifactGrantRuntime.h"
#include "../queries/MapQueries.h"
#include "../queries/QueriesProcessor.h"
#include "../../lib/era/EraCommanderChoiceModel.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/gameState/CGameState.h"
#include "../../lib/mapping/CMap.h"
#include "../../lib/mapObjects/army/CCommanderInstance.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/networkPacks/PacksForClient.h"
namespace era_compat::commander_choices
{
inline const JsonNode & state(CGameHandler & gh)
{return gh.gameState().getMap().eraGameplayState["commanderChoices"];}
inline JsonNode editable(CGameHandler & gh)
{auto next=state(gh);if(next.isNull())next["choices"].Struct();return next;}
inline void persist(CGameHandler & gh,JsonNode next)
{validate(next);EraGameplayChange packet;packet.system="commanderChoices";packet.state=std::move(next);gh.sendAndApply(packet);}
inline std::string key(const CGHeroInstance & hero)
{return std::to_string(hero.getHeroTypeID().getNum());}
inline void remember(CGameHandler & gh,const CGHeroInstance & hero,const CommanderLevelUp & packet)
{
    const auto * commander=hero.getCommander();if(!commander || !commander->eraExperienceWord)return;
    auto next=editable(gh);auto & choice=next["choices"][key(hero)];
    if(choice.isStruct())throw std::runtime_error("Commander choice already pending");
    choice["heroType"].Integer()=hero.getHeroTypeID().getNum();choice["owner"].Integer()=hero.getOwner().getNum();
    choice["level"].Integer()=commander->getLevel()+1;
    choice["visits"]=source_artifacts::captureVisits(gh,hero);
    for(const auto skill:packet.skills){JsonNode entry;entry.Integer()=skill;choice["skills"].Vector().push_back(entry);}
    persist(gh,std::move(next));
}
inline void forget(CGameHandler & gh,const CGHeroInstance & hero)
{
    if(!state(gh)["choices"][key(hero)].isStruct())return;
    auto next=editable(gh);next["choices"].Struct().erase(key(hero));persist(gh,std::move(next));
}
inline bool resume(CGameHandler & gh,const CGHeroInstance & hero)
{
    const auto & choice=state(gh)["choices"][key(hero)];if(!choice.isStruct())return false;
    const auto * commander=hero.getCommander();
    if(!commander || !commander->eraExperienceWord || choice["owner"].Integer()!=hero.getOwner().getNum())
        throw std::runtime_error("Saved commander choice no longer matches hero");
    for(const auto & query:gh.queries->allQueries())
        if(const auto pending=std::dynamic_pointer_cast<CCommanderLevelUpDialogQuery>(query);pending&&pending->hero==&hero)
        {pending->onExposure(gh.queries->topQuery(hero.getOwner()));return true;}
    const auto level=choice["level"].Integer();
    if(commander->getLevel()!=level && commander->getLevel()+1!=level)
        throw std::runtime_error("Saved commander choice no longer matches acquired level");
    source_artifacts::restoreVisits(gh,choice["visits"]);
    CommanderLevelUp packet;packet.player=hero.getOwner();packet.heroId=hero.id;packet.alreadyApplied=commander->getLevel()==level;
    for(const auto & skill:choice["skills"].Vector())packet.skills.push_back(skill.Integer());
    gh.queries->addQuery(std::make_shared<CCommanderLevelUpDialogQuery>(&gh,packet,&hero));return true;
}
inline bool resumePlayer(CGameHandler & gh,PlayerColor owner)
{
    const auto saved=state(gh);if(saved.isNull())return false;validate(saved);
    for(const auto & entry:saved["choices"].Struct())
    {
        if(entry.second["owner"].Integer()!=owner.getNum())continue;
        const HeroTypeID type(entry.second["heroType"].Integer());const CGHeroInstance * hero=nullptr;
        for(const auto & object:gh.gameState().getMap().objects)
            if(const auto * candidate=dynamic_cast<const CGHeroInstance *>(object.get());candidate&&candidate->getHeroTypeID()==type){hero=candidate;break;}
        if(!hero)hero=gh.gameState().getMap().tryGetFromHeroPool(type);
        if(!hero)throw std::runtime_error("Saved commander choice hero is missing");
        if(resume(gh,*hero))return true;
    }
    return false;
}
}
