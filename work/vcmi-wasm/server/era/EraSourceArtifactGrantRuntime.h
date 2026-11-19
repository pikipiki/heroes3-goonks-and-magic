#pragma once
#include "../CGameHandler.h"
#include "../queries/CQuery.h"
#include "../queries/VisitQueries.h"
#include "../queries/MapQueries.h"
#include "../queries/QueriesProcessor.h"
#include "../../lib/era/EraSourceArtifactGrantModel.h"
#include "../../lib/era/EraCampaignArtifactRule.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/entities/artifact/ArtifactUtils.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/mapping/MapFormatSettings.h"
#include "../../lib/mapping/MapIdentifiersH3M.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/texts/CGeneralTextHandler.h"
namespace era_compat::source_artifacts
{
inline JsonNode editable(CGameHandler & gh)
{const auto & saved=state(gh.gameInfo());return saved.isStruct()?saved:emptyState();}
inline void persist(CGameHandler & gh,JsonNode next)
{validate(next);EraGameplayChange packet;packet.system="artifactGrants";packet.state=std::move(next);gh.sendAndApply(packet);}
inline std::string key(const CGHeroInstance & hero)
{return std::to_string(hero.getHeroTypeID().getNum());}
inline const CGHeroInstance * findHero(CGameHandler & gh,int type)
{
    for(const auto & object:gh.gameState().getMap().objects)
        if(const auto * hero=dynamic_cast<const CGHeroInstance *>(object.get());hero&&hero->getHeroTypeID().getNum()==type)return hero;
    return gh.gameState().getMap().tryGetFromHeroPool(HeroTypeID(type));
}
inline bool human(CGameHandler & gh,const CGHeroInstance & hero)
{const auto * player=gh.gameInfo().getPlayerState(hero.getOwner(),false);return player&&player->human;}
class GrantQuery final:public CGenericQuery
{
public:
    int heroType;int64_t revision;bool levelContinuation=false;
    bool completesHeroLevelUp() const override{return levelContinuation;}
    void notifyObjectAboutRemoval(const CGObjectInstance * object,const CGHeroInstance * hero) const override
    {if(levelContinuation)object->heroLevelUpDone(*gh,hero);}
    GrantQuery(CGameHandler & gh,PlayerColor owner,int hero,int64_t rev,std::function<void(std::optional<int32_t>)> reply)
        :CGenericQuery(&gh,owner,reply),heroType(hero),revision(rev){}
};
inline bool pump(CGameHandler & gh,int heroType,bool asynchronous=false);
inline bool hasJob(CGameHandler & gh,const CGHeroInstance & hero)
{return state(gh.gameInfo())["jobs"][key(hero)].isStruct();}
inline bool assemblySeen(CGameHandler & gh,PlayerColor owner,ArtifactID combined)
{
    if(seen(gh.gameInfo(),owner,combined))return true;
    const auto * player=gh.gameInfo().getPlayerState(owner,false);
    if(player&&player->playerLocalSettings)
        for(const auto & value:(*player->playerLocalSettings)["ignoredArtifactAssemblies"].Vector())
            if((value.isString()&&value.String()==ArtifactID::encode(combined.getNum()))||(value.isNumber()&&value.Integer()==combined.getNum()))return true;
    return false;
}
inline ArtifactID combination(CGameHandler & gh,const CGHeroInstance & hero,ArtifactID received,bool isHuman)
{
    const auto possible=ArtifactUtils::assemblyPossibilities(&hero,received,true);
    const auto & mapping=LIBRARY->mapFormat->getMapping(EMapFormat::WOG);
    // Original combinations are checked in their source-table order.
    for(int source=129;source<=140;++source)
    {
        const auto id=mapping.remap(ArtifactID(source));
        for(const auto * candidate:possible)
            if(candidate->getId()==id&&(!isHuman||!assemblySeen(gh,hero.getOwner(),id)))return id;
    }
    return ArtifactID::NONE;
}
inline ArtifactPosition place(CGameHandler & gh,const CGHeroInstance & hero,int source,int spell)
{
    if(gh.gameInfo().getHero(hero.id)!=&hero)throw std::runtime_error("Original artifact grant holder has no native identity");
    const auto id=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(source));const auto * type=id.toArtifact();
    if(!type)throw std::runtime_error("Missing original artifact grant prototype");
    ArtifactPosition destination=ArtifactPosition::PRE_FIRST;
    for(int slot=0;slot<=18;++slot)
        if(hero.isPositionFree(ArtifactPosition(slot))&&type->canBePutAt(&hero,ArtifactPosition(slot),false)){destination=ArtifactPosition(slot);break;}
    if(destination==ArtifactPosition::PRE_FIRST&&hero.artifactsInBackpack.size()<64)
    {
        const ArtifactPosition backpack(int(ArtifactPosition::BACKPACK_START)+hero.artifactsInBackpack.size());
        if(type->canBePutAt(&hero,backpack,false))destination=backpack;
    }
    if(destination==ArtifactPosition::PRE_FIRST)return destination;
    const bool given=spell>=0?gh.giveHeroNewScroll(&hero,SpellID(spell),destination):gh.giveHeroNewArtifact(&hero,id,destination);
    return given?destination:ArtifactPosition::PRE_FIRST;
}
inline void show(CGameHandler & gh,int heroType)
{
    const auto saved=editable(gh);const auto & job=saved["jobs"][std::to_string(heroType)];
    const auto * hero=findHero(gh,heroType);if(!hero)throw std::runtime_error("Original artifact grant hero disappeared");
    const auto revision=job["revision"].Integer();
    for(const auto & query:gh.queries->allQueries())
        if(const auto own=std::dynamic_pointer_cast<GrantQuery>(query);own&&own->heroType==heroType&&own->revision==revision)return;
    const auto phase=job["phase"].String();const bool assembly=phase=="assembly";
    auto query=std::make_shared<GrantQuery>(gh,hero->getOwner(),heroType,revision,[&gh,heroType,revision](std::optional<int32_t> answer)
    {
        auto next=editable(gh);auto & current=next["jobs"][std::to_string(heroType)];
        if(!current.isStruct()||current["revision"].Integer()!=revision)return;
        const auto * hero=findHero(gh,heroType);if(!hero)throw std::runtime_error("Original artifact reply hero disappeared");
        if(current["phase"].String()=="assembly")
        {
            if(answer.value_or(0)>0)
                gh.assembleArtifacts(hero->id,ArtifactPosition(current["slot"].Integer()),true,ArtifactID(current["combined"].Integer()));
        }
        else if(current["phase"].String()=="summary")current["summaryCursor"].Integer()=current["summaryEnd"].Integer();
        else throw std::runtime_error("Unexpected original artifact reply phase");
        current["phase"].String().clear();current["revision"].Integer()++;persist(gh,std::move(next));pump(gh,heroType,true);
    });
    query->levelContinuation=job["resumeLevel"].Bool();
    gh.queries->addQuery(query);BlockingDialog packet(assembly,false);packet.queryID=query->queryID;packet.player=hero->getOwner();
    if(assembly)
    {
        const ArtifactID combined(job["combined"].Integer());
        packet.text.appendTextID(combined.toArtifact()->getDescriptionTextID());packet.text.appendEOL();packet.text.appendEOL();
        packet.text.appendLocalString(EMetaText::GENERAL_TXT,732);packet.text.replaceName(combined);
        packet.components.emplace_back(ComponentType::ARTIFACT,combined);
    }
    else
    {
        packet.text.appendTextID("tum-era.levelArtifacts.rewards");packet.text.replaceTextID(hero->getNameTextID());
        const auto & entries=job["entries"].Vector();
        for(int index=job["summaryCursor"].Integer();index<job["summaryEnd"].Integer();++index)
            if(entries[index]["source"].isNumber())packet.components.emplace_back(ComponentType::ARTIFACT,
                LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(entries[index]["source"].Integer())));
    }
    gh.sendAndApply(packet);
}
inline bool pump(CGameHandler & gh,int heroType,bool asynchronous)
{
    for(;;)
    {
        auto next=editable(gh);auto & jobs=next["jobs"].Struct();const auto found=jobs.find(std::to_string(heroType));if(found==jobs.end())return true;
        auto & job=found->second;const auto * hero=findHero(gh,heroType);if(!hero)throw std::runtime_error("Original artifact queue hero disappeared");
        if(!job["phase"].String().empty()){show(gh,heroType);return false;}
        auto & entries=job["entries"].Vector();const int cursor=job["cursor"].Integer();
        if(cursor<int(entries.size()))
        {
            auto & entry=entries[cursor];
            if(!entry["source"].isNumber())
            {
                const auto selected=gh.randomizer->rollOriginalArtifact(entry["class"].Integer());
                if(!selected)throw std::runtime_error("No allowed original artifact reward");
                entry["source"].Integer()=*selected;entry["spell"].Integer()=-1;
            }
            const int source=entry["source"].Integer(),spell=entry["spell"].isNumber()?entry["spell"].Integer():-1;
            const auto id=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(ArtifactID(source));
            const auto slot=place(gh,*hero,source,spell);entry["placed"].Bool()=slot!=ArtifactPosition::PRE_FIRST;job["cursor"].Integer()=cursor+1;
            if(slot.getNum()>=0&&slot.getNum()<=18)
            {
                const bool isHuman=human(gh,*hero);const auto combined=combination(gh,*hero,id,isHuman);
                if(combined!=ArtifactID::NONE)
                {
                    if(isHuman)
                    {
                        next["seen"][std::to_string(hero->getOwner().getNum())][std::to_string(combined.getNum())].Bool()=true;
                        job["phase"].String()="assembly";job["slot"].Integer()=slot.getNum();job["combined"].Integer()=combined.getNum();job["revision"].Integer()++;
                    }
                    else gh.assembleArtifacts(hero->id,slot,true,combined);
                }
            }
            persist(gh,std::move(next));continue;
        }
        if(job["summary"].Bool()&&job["summaryCursor"].Integer()<entries.size())
        {
            job["summaryEnd"].Integer()=std::min<int>(entries.size(),job["summaryCursor"].Integer()+8);
            job["phase"].String()="summary";job["revision"].Integer()++;persist(gh,std::move(next));continue;
        }
        const bool resumeLevel=job["resumeLevel"].Bool();jobs.erase(found);persist(gh,std::move(next));
        if(asynchronous&&resumeLevel)gh.expGiven(hero);
        return true;
    }
}
inline JsonNode captureVisits(CGameHandler & gh,const CGHeroInstance & hero)
{
    JsonNode result;result.Vector();
    for(const auto & query:gh.queries->allQueries())
    {
        if(const auto move=std::dynamic_pointer_cast<CHeroMovementQuery>(query);move&&move->hero==&hero)
        {
            JsonNode entry;entry["kind"].String()="movement";entry["hero"].Integer()=hero.id.getNum();
            entry["visitDestination"].Bool()=move->visitDestAfterVictory;
            entry["x"].Integer()=move->tmh.end.x;entry["y"].Integer()=move->tmh.end.y;entry["z"].Integer()=move->tmh.end.z;
            result.Vector().push_back(entry);continue;
        }
        const auto visit=std::dynamic_pointer_cast<VisitQuery>(query);
        if(!visit||visit->visitingHero!=hero.id)continue;
        JsonNode entry;
        if(const auto town=std::dynamic_pointer_cast<TownBuildingVisitQuery>(query))entry=town->checkpoint();
        else if(const auto object=std::dynamic_pointer_cast<MapObjectVisitQuery>(query))
        {
            entry["kind"].String()="object";entry["object"].Integer()=object->visitedObject.getNum();
            entry["hero"].Integer()=object->visitingHero.getNum();entry["remove"].Bool()=object->removeObjectAfterVisit;
        }
        if(entry.isStruct())result.Vector().push_back(entry);
    }
    return result;
}
inline void restoreVisits(CGameHandler & gh,const JsonNode & saved)
{
    for(const auto & entry:saved.Vector())
    {
        if(entry["kind"].String()=="movement")
        {
            const auto * hero=gh.gameInfo().getHero(ObjectInstanceID(entry["hero"].Integer()));
            if(!hero)throw std::runtime_error("Saved reward movement hero no longer exists");
            bool present=false;
            for(const auto & query:gh.queries->allQueries())
                if(const auto movement=std::dynamic_pointer_cast<CHeroMovementQuery>(query);movement&&movement->hero==hero)present=true;
            if(!present)
            {
                TryMoveHero move;move.id=hero->id;move.end=int3(entry["x"].Integer(),entry["y"].Integer(),entry["z"].Integer());
                gh.queries->addQuery(std::make_shared<CHeroMovementQuery>(&gh,move,hero,entry["visitDestination"].Bool()));
            }
            continue;
        }
        bool present=false;
        for(const auto & query:gh.queries->allQueries())
            if(const auto visit=std::dynamic_pointer_cast<VisitQuery>(query);visit&&visit->visitedObject.getNum()==entry["object"].Integer()
                &&visit->visitingHero.getNum()==entry["hero"].Integer()
                &&bool(std::dynamic_pointer_cast<TownBuildingVisitQuery>(query))==(entry["kind"].String()=="town"))present=true;
        if(present)continue;
        const auto * object=gh.gameInfo().getObjInstance(ObjectInstanceID(entry["object"].Integer()));
        const auto * hero=gh.gameInfo().getHero(ObjectInstanceID(entry["hero"].Integer()));
        if(!object||!hero)throw std::runtime_error("Saved level reward visit no longer exists");
        if(entry["kind"].String()=="town")gh.queries->addQuery(std::make_shared<TownBuildingVisitQuery>(&gh,entry));
        else
        {
            auto visit=std::make_shared<MapObjectVisitQuery>(&gh,object,hero);visit->removeObjectAfterVisit=entry["remove"].Bool();gh.queries->addQuery(visit);
        }
    }
}
inline bool enqueue(CGameHandler & gh,const CGHeroInstance & hero,JsonVector entries,bool summary,bool resumeLevel,JsonNode visits=JsonNode())
{
    auto next=editable(gh);auto & job=next["jobs"][key(hero)];
    if(job.isStruct())throw std::runtime_error("Overlapping original artifact grant jobs");
    job["hero"].Integer()=hero.id.getNum();job["heroType"].Integer()=hero.getHeroTypeID().getNum();
    job["owner"].Integer()=hero.getOwner().isValidPlayer()?hero.getOwner().getNum():-1;
    job["visits"]=std::move(visits);
    job["entries"].Vector()=std::move(entries);job["cursor"].Integer()=0;job["summaryCursor"].Integer()=0;
    job["revision"].Integer()=0;job["summary"].Bool()=summary;job["resumeLevel"].Bool()=resumeLevel;
    persist(gh,std::move(next));return pump(gh,hero.getHeroTypeID().getNum());
}
inline bool give(CGameHandler & gh,const CGHeroInstance & hero,int source,int spell=-1)
{
    if(hasJob(gh,hero))return pump(gh,hero.getHeroTypeID().getNum());
    JsonNode entry;entry["source"].Integer()=source;entry["spell"].Integer()=spell;
    return enqueue(gh,hero,JsonVector{entry},false,false);
}
}
