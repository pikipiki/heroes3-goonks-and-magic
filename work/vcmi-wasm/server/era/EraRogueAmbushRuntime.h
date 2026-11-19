/* Source77 rule127: visit-triggered ambushes; GPL-2.0-or-later. */
#pragma once
#include "EraTemporaryBattleArmy.h"
#include "SourceCampaignProcessor.h"
#include "../../lib/era/EraRogueAmbushRules.h"
#include "../../lib/era/EraRogueAmbushState.h"
#include "../../lib/era/EraMapRulesModel.h"
#include "../../lib/era/EraCampaignHints.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/battle/BattleLayout.h"
#include "../../lib/entities/faction/CFaction.h"
#include "../../lib/entities/faction/CTown.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../queries/CQuery.h"
#include "../queries/BattleQueries.h"
#include "../queries/MapQueries.h"
#include "../queries/VisitQueries.h"
#include "../queries/QueriesProcessor.h"
#include <limits>
namespace era_compat::rogues
{
namespace rules=era_bridge::rogue_ambush;
inline const JsonNode & state(CGameHandler & gh){return map_rules::state(gh.gameInfo());}
inline const JsonNode & job(CGameHandler & gh,PlayerColor controller)
{return pending(state(gh),controller.getNum());}
inline void persist(CGameHandler & gh,JsonNode value)
{EraGameplayChange packet;packet.system="mapRules";packet.state=std::move(value);gh.sendAndApply(packet);}
inline void flag(CGameHandler & gh,bool value)
{
    auto next=state(gh);next["rogues"]["flag875"].Bool()=value;persist(gh,std::move(next));
    gh.sourceCampaigns->setCompatibilityFlag(875,value);
}
inline void playerTurn(CGameHandler & gh,PlayerColor controller)
{
    if(!state(gh)["rules"]["127"].Bool()||!controller.isValidPlayer())return;
    const auto * player=gh.gameInfo().getPlayerState(controller,false);if(!player)return;
    auto next=state(gh);auto & context=next["rogues"]["timer"];
    context["owner"].Integer()=controller.getNum();context["human"].Bool()=player->isHuman();
    const int32_t day=rules::word(uint32_t(gh.gameState().day));
    context["day"].Integer()=day;
    context["week"].Integer()=day>0?rules::week(day):0;persist(gh,std::move(next));
}
inline std::optional<CreatureID> upgrade(CreatureID type)
{
    const auto * creature=type.toCreature();const auto faction=creature->getFactionID();
    if(!faction.hasValue())return std::nullopt;
    const auto * definition=faction.toFaction();
    if(!definition||!definition->town)return std::nullopt;
    const int tier=creature->getLevel()-1;
    const auto & rows=definition->town->creatures;
    if(tier<0||tier>=int(rows.size())||rows[tier].size()<2||rows[tier][0]!=type)return std::nullopt;
    return rows[tier][1];
}
inline std::optional<rules::Formation> formation(const CGHeroInstance & hero,const int3 & position,CreatureID type,int32_t count)
{
    std::array<int32_t,7> values{},counts{};
    for(const auto & entry:hero.Slots())if(entry.first.validSlot())
    {
        const int slot=entry.first.getNum();
        values[slot]=rules::word(uint32_t(entry.second->getType()->getAIValue()));
        counts[slot]=rules::word(uint32_t(entry.second->getCount()));
    }
    const int32_t enemy=rules::enemyStrength(rules::word(uint32_t(type.toCreature()->getAIValue())),count);
    if(count<=0||enemy==0)return std::nullopt;
    const double ratio=double(rules::armyStrength(values,counts))/double(enemy);
    rules::FormationRandom random(rules::formationSeed(position.x,position.y,position.z));
    const int first=random.percent();const auto groups=rules::groups(ratio,first,count);
    if(!groups)return std::nullopt;
    const auto better=*groups>1?upgrade(type):std::nullopt;
    return rules::formation(count,ratio,type.getNum(),first,
        better?std::optional<int>(better->getNum()):std::nullopt,
        better?std::optional<int>(random.percent()):std::nullopt);
}
inline void battleFinished(CGameHandler &,PlayerColor,int64_t);
inline void finish(CGameHandler &,PlayerColor,int64_t,bool);
inline void removed(CGameHandler &,PlayerColor,int64_t);
inline void startBattle(CGameHandler &,PlayerColor,int64_t);
inline void show(CGameHandler &,PlayerColor,int64_t);
class VisitQuery final:public CQuery
{
    CGameHandler & game;
public:
    PlayerColor controller;int64_t token;
    VisitQuery(CGameHandler & gh,PlayerColor player,int64_t revision):CQuery(&gh),game(gh),controller(player),token(revision){addPlayer(player);}
    bool blocksPack(const CPackForServer *)const override{return true;}
    void onExposure(QueryPtr previous)override
    {
        const auto & current=job(game,controller);
        if(!current.isStruct()||current["token"].Integer()!=token)return;
        if(current["phase"].String()=="complete"){owner->popQuery(*this);return;}
        const auto battle=std::dynamic_pointer_cast<CBattleQuery>(previous);
        if(current["phase"].String()=="battle"&&battle&&battle->result)battleFinished(game,controller,token);
    }
    void onRemoval(PlayerColor)override{removed(game,controller,token);}
};
class PromptQuery final:public CGenericQuery
{
public:
    PlayerColor controller;int64_t token;std::string phase;
    PromptQuery(CGameHandler & gh,PlayerColor player,int64_t revision,const std::string & stage,
        const std::function<void(std::optional<int32_t>)> & callback)
        :CGenericQuery(&gh,player,callback),controller(player),token(revision),phase(stage){}
};
inline std::shared_ptr<VisitQuery> barrier(CGameHandler & gh,PlayerColor controller,int64_t token)
{
    for(const auto & query:gh.queries->allQueries())
        if(auto found=std::dynamic_pointer_cast<VisitQuery>(query);found&&found->controller==controller&&found->token==token)return found;
    return {};
}
inline void removed(CGameHandler & gh,PlayerColor controller,int64_t token)
{
    const auto completed=job(gh,controller);
    if(!completed.isStruct()||completed["token"].Integer()!=token||completed["phase"].String()!="complete")return;
    auto next=state(gh);next["rogues"]["pending"].Struct().erase(std::to_string(controller.getNum()));persist(gh,std::move(next));
    if(!completed["resume"].Bool())return;
    const auto * object=gh.gameInfo().getObjInstance(ObjectInstanceID(completed["object"].Integer()));
    const auto * hero=gh.gameInfo().getHero(ObjectInstanceID(completed["hero"].Integer()));
    if(!object||!hero||!hero->getOwner().isValidPlayer())return;
    const bool actual=completed["actualEntry"].Bool();
    if(!gh.sourceCampaigns->visit(object,hero,actual))gh.nativeObjectVisit(object,hero,actual);
}
inline void finish(CGameHandler & gh,PlayerColor controller,int64_t token,bool survives)
{
    const auto current=job(gh,controller);
    if(!current.isStruct()||current["token"].Integer()!=token)return;
    // Both lines follow the human treasure message in the original function.
    // A dead/escaped hero deliberately leaves875 set for subsequent scripts.
    if(survives)flag(gh,false);
    auto next=state(gh);auto & active=next["rogues"]["pending"][std::to_string(controller.getNum())];
    const auto owner=std::to_string(current["timerOwner"].Integer());
    next["rogues"]["lastDates"][owner]=current["day"];
    active["phase"].String()="complete";active["resume"].Bool()=survives;persist(gh,std::move(next));
    gh.sourceCampaigns->setNamedInteger("wog_127_lastRogueDate_"+owner,int32_t(current["day"].Integer()));
    if(const auto query=barrier(gh,controller,token))gh.queries->popIfTop(query);
    else if(!survives)removed(gh,controller,token);
}
inline void battleFinished(CGameHandler & gh,PlayerColor controller,int64_t token)
{
    const auto current=job(gh,controller);
    if(!current.isStruct()||current["token"].Integer()!=token||current["phase"].String()!="battle")return;
    const auto army=ObjectInstanceID(current["army"].Integer());
    if(gh.gameState().getMap().temporaryBattleArmies.count(army))temporary_armies::release(gh,army);
    const auto * hero=gh.gameInfo().getHero(ObjectInstanceID(current["hero"].Integer()));
    if(!hero||!hero->getOwner().isValidPlayer()){finish(gh,controller,token,false);return;}
    if(current["water"].Bool()){finish(gh,controller,token,true);return;}
    const int32_t count=int32_t(current["count"].Integer());
    const auto old=rules::word(uint32_t(gh.gameInfo().getPlayerState(hero->getOwner())->resources[GameResID::GOLD]));
    if(const auto value=rules::goldAfter(old,count))
    {
        EraResourceWordChange packet;packet.player=hero->getOwner();packet.resource=GameResID::GOLD;packet.amount=*value;gh.sendAndApply(packet);
    }
    if(!current["human"].Bool()){finish(gh,controller,token,true);return;}
    auto next=state(gh);auto & active=next["rogues"]["pending"][std::to_string(controller.getNum())];
    active["phase"].String()="reward";active["gold"].Integer()=rules::gold(count);active["goldGranted"].Bool()=true;persist(gh,std::move(next));
    show(gh,controller,token);
}
inline void startBattle(CGameHandler & gh,PlayerColor controller,int64_t token)
{
    const auto current=job(gh,controller);
    if(!current.isStruct()||current["token"].Integer()!=token)return;
    const auto * hero=gh.gameInfo().getHero(ObjectInstanceID(current["hero"].Integer()));
    if(!hero||!hero->getOwner().isValidPlayer()){finish(gh,controller,token,false);return;}
    const int3 position(current["x"].Integer(),current["y"].Integer(),current["z"].Integer());
    ObjectInstanceID army=ObjectInstanceID::NONE;
    if(current["army"].isNumber())army=ObjectInstanceID(current["army"].Integer());
    else
    {
        const int32_t count=rules::quantity(int32_t(current["week"].Integer()),int32_t(hero->level));
        const int source=rules::creature(current["human"].Bool(),current["water"].Bool());
        const auto type=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(CreatureID(source));
        const auto groups=formation(*hero,position,type,count);
        if(!groups)throw std::runtime_error("Unrepresentable original ambush formation");
        std::vector<std::pair<CreatureID,int32_t>> stacks;
        for(int i=0;i<groups->groups;++i)stacks.emplace_back(CreatureID(groups->types[i]),groups->counts[i]);
        army=temporary_armies::create(gh,position,stacks);
        auto next=state(gh);auto & active=next["rogues"]["pending"][std::to_string(controller.getNum())];
        active["army"].Integer()=army.getNum();active["count"].Integer()=count;active["creature"].Integer()=source;
        active["phase"].String()="battle";persist(gh,std::move(next));
    }
    flag(gh,true);
    const auto * defenders=dynamic_cast<const CArmedInstance *>(gh.gameInfo().getObjInstance(army));
    if(!defenders)throw std::runtime_error("Missing original ambush army");
    gh.startBattle(hero,defenders,position,hero,nullptr,BattleLayout::createDefaultLayout(gh.gameInfo(),hero,defenders),nullptr);
    const auto query=barrier(gh,controller,token);
    // A cancelled pre-battle hook returns to the caller without removing its
    // hero. Original HE:T still proceeds to its owner check in that case.
    if(query&&gh.queries->topQuery(controller)==query&&!gh.gameState().getBattle(hero->getOwner()))battleFinished(gh,controller,token);
}
inline void show(CGameHandler & gh,PlayerColor controller,int64_t token)
{
    const auto current=job(gh,controller);
    if(!current.isStruct()||current["token"].Integer()!=token)return;
    const auto phase=current["phase"].String();if(phase!="warning"&&phase!="reward")return;
    for(const auto & query:gh.queries->allQueries())
        if(const auto existing=std::dynamic_pointer_cast<PromptQuery>(query);existing&&existing->controller==controller&&existing->token==token&&existing->phase==phase)return;
    auto query=std::make_shared<PromptQuery>(gh,controller,token,phase,[&gh,controller,token,phase](std::optional<int32_t>)
    {
        const auto & current=job(gh,controller);
        if(!current.isStruct()||current["token"].Integer()!=token||current["phase"].String()!=phase)return;
        if(phase=="warning")startBattle(gh,controller,token);else finish(gh,controller,token,true);
    });
    gh.queries->addQuery(query);BlockingDialog packet(false,false);packet.player=controller;packet.queryID=query->queryID;
    if(phase=="warning")
    {
        const bool water=current["water"].Bool();packet.text.appendTextID(water?"tum-era.mapRules.rogues.water":"tum-era.mapRules.rogues.land");
        packet.text.replaceRawString(current["heroName"].String());if(water)packet.text.replaceRawString(current["heroName"].String());
        const auto type=LIBRARY->mapFormat->getMapping(EMapFormat::WOG).remap(CreatureID(water?115:143));
        packet.components.emplace_back(ComponentType::CREATURE,type,1);
    }
    else
    {
        packet.text.appendTextID("tum-era.mapRules.rogues.treasure");
        packet.components.emplace_back(ComponentType::RESOURCE,GameResID(GameResID::GOLD),int32_t(current["gold"].Integer()));
    }
    gh.sendAndApply(packet);
}
inline bool ready(CGameHandler & gh,PlayerColor controller)
{
    const auto current=job(gh,controller);if(!current.isStruct())return false;
    const auto token=current["token"].Integer();const auto phase=current["phase"].String();
    auto query=barrier(gh,controller,token);
    if(!query)
    {
        const auto * object=gh.gameInfo().getObjInstance(ObjectInstanceID(current["object"].Integer()));
        const auto * hero=gh.gameInfo().getHero(ObjectInstanceID(current["hero"].Integer()));
        if(!hero||!hero->getOwner().isValidPlayer()){finish(gh,controller,token,false);return false;}
        if(object&&!gh.getVisitingHero(object))gh.queries->addQuery(std::make_shared<MapObjectVisitQuery>(&gh,object,hero));
        query=std::make_shared<VisitQuery>(gh,controller,token);gh.queries->addQuery(query);
        if(phase=="battle"||phase=="prepare")startBattle(gh,controller,token);
    }
    if(phase=="complete")gh.queries->popIfTop(query);
    else if(phase=="warning"||phase=="reward")show(gh,controller,token);
    return true;
}
inline bool visit(CGameHandler & gh,const CGObjectInstance * object,const CGHeroInstance * hero,bool actualEntry)
{
    if(!state(gh)["rules"]["127"].Bool()||!object||!hero||!hero->getOwner().isValidPlayer())return false;
    const auto source=era_campaign_hints::identity(gh.gameState().getMap().sourceCampaignState,*object);
    if(!rules::eligibleObject(int(source.ID)))return false;
    const auto controller=hero->getOwner();if(job(gh,controller).isStruct())return true;
    const auto timer=state(gh)["rogues"]["timer"];if(!timer.isStruct())return false;
    const int owner=int(timer["owner"].Integer()),day=int(timer["day"].Integer());
    const auto last=state(gh)["rogues"]["lastDates"][std::to_string(owner)].Integer();
    if(!rules::canRoll(true,day,owner,int32_t(last)))return false;
    const bool human=timer["human"].Bool();const int roll=gh.randomizer->getDefault().nextInt(0,rules::chanceMaximum(human));
    flag(gh,false);if(roll!=0)return false;
    const auto position=object->visitablePos();auto next=state(gh);
    const int64_t previous=next["rogues"]["sequence"].Integer();
    if(previous<0||previous==std::numeric_limits<int64_t>::max())throw std::runtime_error("Invalid original ambush visit sequence");
    const int64_t token=previous+1;next["rogues"]["sequence"].Integer()=token;
    auto & active=next["rogues"]["pending"][std::to_string(controller.getNum())];
    active["token"].Integer()=token;active["controller"].Integer()=controller.getNum();active["hero"].Integer()=hero->id.getNum();
    active["object"].Integer()=object->id.getNum();active["actualEntry"].Bool()=actualEntry;
    active["timerOwner"].Integer()=owner;active["human"].Bool()=human;active["day"]=timer["day"];active["week"]=timer["week"];
    active["x"].Integer()=position.x;active["y"].Integer()=position.y;active["z"].Integer()=position.z;
    active["water"].Bool()=gh.gameState().getMap().getTile(position).isWater();active["heroName"].String()=hero->getNameTranslated();
    active["phase"].String()=human?"warning":"prepare";persist(gh,std::move(next));
    auto query=std::make_shared<VisitQuery>(gh,controller,token);gh.queries->addQuery(query);
    if(human)show(gh,controller,token);else startBattle(gh,controller,token);
    return true;
}
}
