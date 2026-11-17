#pragma once
#include "EraHenchmanRuntime.h"
#include "../queries/CQuery.h"
#include "../queries/QueriesProcessor.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/networkPacks/PacksForClient.h"

namespace era_compat::henchmen
{
inline void chooseBeforeBattle(CGameHandler & gh,const CGHeroInstance & hero,std::function<void()> resume)
{
    std::vector<std::pair<int,CreatureID>> slots;
    std::vector<Component> components;
    for(const auto & [slot,stack]:hero.Slots())
        if(slot.validSlot()&&canSelect(hero,slot.getNum()))
        {
            slots.emplace_back(slot.getNum(),stack->getId());
            components.emplace_back(ComponentType::CREATURE,stack->getId(),stack->getCount());
        }
    if(slots.empty()){resume();return;}
    const auto id=hero.id;const auto owner=hero.getOwner();const auto revision=hero.henchman.revision;
    auto query=std::make_shared<CGenericQuery>(&gh,owner,
        [&gh,id,owner,revision,slots,resume=std::move(resume)](std::optional<int32_t> reply)
        {
            const auto selected=static_cast<int64_t>(reply.value_or(0))-1;
            if(selected>=0&&selected<int(slots.size()))
            {
                HenchmanAction request;request.player=owner;request.hero=id;
                request.operation=HenchmanAction::SELECT;request.revision=revision;
                request.slot=slots[selected].first;request.expectedCreature=slots[selected].second;
                action(gh,request);
            }
            // Cancelling the chooser leaves NO_MON, so the source asks again
            // at the next encounter. Only declining the first question opts out.
            resume();
        });
    gh.queries->addQuery(query);
    BlockingDialog packet(true,true);packet.player=owner;packet.queryID=query->queryID;
    packet.text.appendTextID("tum-era.henchmen.chooseBeforeBattle");packet.components=std::move(components);
    gh.sendAndApply(packet);
}

inline bool offerBeforeBattle(CGameHandler & gh,const CGHeroInstance * hero,std::function<void()> resume)
{
    if(!hero||!enabled(gh.gameInfo())||hero->henchman.stack||hero->henchman.declined)return false;
    const auto * player=gh.gameInfo().getPlayerState(hero->getOwner(),false);
    if(!player||!player->isHuman())return false;
    bool eligible=false;
    for(const auto & [slot,stack]:hero->Slots())
        if(slot.validSlot()&&canSelect(*hero,slot.getNum())){eligible=true;break;}
    if(!eligible)return false;
    const auto id=hero->id;const auto owner=hero->getOwner();const auto revision=hero->henchman.revision;
    auto query=std::make_shared<CGenericQuery>(&gh,owner,
        [&gh,id,owner,revision,resume=std::move(resume)](std::optional<int32_t> reply)
        {
            const auto * current=gh.gameInfo().getHero(id);
            if(!current||current->getOwner()!=owner||current->battle||current->henchman.stack
                ||current->henchman.revision!=revision){resume();return;}
            if(reply.value_or(0)!=0){chooseBeforeBattle(gh,*current,resume);return;}
            auto update=snapshot(*current);update.declined=true;gh.sendAndApply(update);
            resume();
        });
    gh.queries->addQuery(query);
    BlockingDialog packet(true,false);packet.player=owner;packet.queryID=query->queryID;
    packet.text.appendTextID("tum-era.henchmen.offerBeforeBattle");gh.sendAndApply(packet);
    return true;
}
}
