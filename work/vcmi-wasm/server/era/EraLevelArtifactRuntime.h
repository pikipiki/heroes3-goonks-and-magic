#pragma once
#include "EraSourceArtifactGrantRuntime.h"
#include "../../lib/era/EraLevelArtifactRules.h"
#include "../../lib/era/EraCampaignChestRule.h"
#include "../../lib/entities/hero/CHeroHandler.h"
#include "../queries/MapQueries.h"
namespace era_compat::source_artifacts
{
inline bool levelRule(CGameHandler & gh)
{return gh.gameState().getMap().eraGameplayState["mapRules"]["rules"]["126"].Bool();}
inline void beforeLevel(CGameHandler & gh,const CGHeroInstance & hero)
{
    if(!levelRule(gh))return;
    const int gained=hero.level+1;
    if(!human(gh,hero))
    {
        JsonNode entry;entry["class"].Integer()=era_bridge::level_artifacts::classMask(gained,false);
        enqueue(gh,hero,JsonVector{entry},false,false);return;
    }
    auto next=editable(gh);auto & record=next["levels"][key(hero)];
    if(record.isStruct())return;
    const auto count=era_bridge::level_artifacts::humanBatchCount(gained,era_campaign_chest::signedWord(hero.exp),[](int level)->int64_t
    {
        return std::min<uint64_t>(LIBRARY->heroh->reqExp(level),uint64_t(INT32_MAX)+1);
    });
    if(!count)return;
    record["heroType"].Integer()=hero.getHeroTypeID().getNum();record["owner"].Integer()=hero.getOwner().getNum();
    record["visits"]=captureVisits(gh,hero);
    record["first"].Integer()=gained;record["count"].Integer()=count;record["left"].Integer()=count;
    persist(gh,std::move(next));
}
inline void rememberChoice(CGameHandler & gh,const CGHeroInstance & hero,const HeroLevelUp & hlu)
{
    if(!state(gh.gameInfo())["levels"][key(hero)].isStruct())return;
    auto next=editable(gh);auto & choice=next["levels"][key(hero)]["choice"];
    choice["level"].Integer()=hero.level+1;choice["primary"].Integer()=int(hlu.primskill);
    for(const auto & skill:hlu.skills){JsonNode value;value.Integer()=skill.getNum();choice["skills"].Vector().push_back(value);}
    persist(gh,std::move(next));
}
inline void forgetChoice(CGameHandler & gh,const CGHeroInstance & hero)
{
    if(!state(gh.gameInfo())["levels"][key(hero)]["choice"].isStruct())return;
    auto next=editable(gh);next["levels"][key(hero)].Struct().erase("choice");persist(gh,std::move(next));
}
inline bool afterLevel(CGameHandler & gh,const CGHeroInstance & hero)
{
    if(!state(gh.gameInfo())["levels"][key(hero)].isStruct())return true;
    auto next=editable(gh);auto & record=next["levels"][key(hero)];
    record["left"].Integer()--;
    if(record["left"].Integer()>0){persist(gh,std::move(next));return true;}
    JsonVector entries;
    for(int index=0;index<record["count"].Integer();++index)
    {
        JsonNode entry;entry["class"].Integer()=era_bridge::level_artifacts::classMask(record["first"].Integer()+index,true);
        entries.push_back(entry);
    }
    const auto visits=record["visits"];next["levels"].Struct().erase(key(hero));persist(gh,std::move(next));
    return enqueue(gh,hero,std::move(entries),true,true,visits);
}
// Returns true only when a saved interaction now owns the continuation.
inline bool resumeLevel(CGameHandler & gh,const CGHeroInstance & hero)
{
    if(hasJob(gh,hero))
    {restoreVisits(gh,state(gh.gameInfo())["jobs"][key(hero)]["visits"]);return !pump(gh,hero.getHeroTypeID().getNum());}
    const auto & record=state(gh.gameInfo())["levels"][key(hero)];const auto & choice=record["choice"];
    if(!choice.isStruct())return false;
    for(const auto & query:gh.queries->allQueries())
        if(const auto level=std::dynamic_pointer_cast<CHeroLevelUpDialogQuery>(query);level&&level->hero==&hero)return true;
    restoreVisits(gh,record["visits"]);
    HeroLevelUp hlu;hlu.player=hero.getOwner();hlu.heroId=hero.id;hlu.primskill=PrimarySkill(choice["primary"].Integer());
    const auto savedLevel=choice["level"].Integer();
    if(hero.level!=savedLevel&&hero.level+1!=savedLevel)throw std::runtime_error("Original reward level choice no longer matches hero");
    hlu.alreadyApplied=hero.level==savedLevel;
    for(const auto & value:choice["skills"].Vector())hlu.skills.emplace_back(value.Integer());
    gh.queries->addQuery(std::make_shared<CHeroLevelUpDialogQuery>(&gh,hlu,&hero));return true;
}
inline bool resumePlayer(CGameHandler & gh,PlayerColor owner)
{
    std::set<int> types;const auto saved=editable(gh);
    for(const auto * name:{"levels","jobs"})
        for(const auto & pair:saved[name].Struct())if(pair.second["owner"].Integer()==owner.getNum())types.insert(pair.second["heroType"].Integer());
    for(const int type:types)if(const auto * hero=findHero(gh,type);hero&&resumeLevel(gh,*hero))return true;
    return false;
}
}
