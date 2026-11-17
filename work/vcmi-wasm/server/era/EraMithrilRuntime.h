#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/mapObjectConstructors/CRewardableConstructor.h"
#include "../../lib/CSkillHandler.h"
#include <limits>

namespace era_compat::mithril
{
inline bool action(CGameHandler & gh,const MithrilAction & request)
{
    const auto & cb=gh.gameInfo();
    if(!enabled(cb)||request.revision!=revision(cb))return false;
    const auto * object=cb.getObj(request.object);
    if(!object)return false;
    const auto proposed=offer(cb,*object,request.player,request.choice);
    if(proposed.kind!=TOWN&&request.choice!=0)return false;
    const auto currency=resource();
    if(!proposed.available()||currency==GameResID::NONE
        ||cb.getPlayerState(request.player)->resources[currency]<proposed.cost)return false;
    auto next=state(cb);
    next["revision"].Integer()=request.revision+1;
    auto & target=next["objects"][std::to_string(object->id.getNum())];
    if(proposed.kind==MINE)target["mineUntil"].Integer()=cb.getDate(Date::DAY)+7;
    else if(proposed.kind==MILL)target["mill"].Bool()=true;
    else if(proposed.kind==UNIVERSITY)target["university"].Bool()=true;
    else if(proposed.kind==SHRINE||proposed.kind==HUT)
    {
        const auto * reward=dynamic_cast<const CRewardableObject *>(object);
        const auto constructor=std::dynamic_pointer_cast<const CRewardableConstructor>(object->getObjectHandler());
        if(!reward||!constructor||proposed.alternatives.empty())return false;
        if(next["seed"].isNull())next["seed"].Integer()=gh.getRandomGenerator().nextInt(1,INT32_MAX);
        const auto position=object->visitablePos();
        const auto seed=era_bridge::mithril::coordinateSeed(static_cast<uint32_t>(next["seed"].Integer()),position.x,position.y,position.z)
            +static_cast<uint32_t>(target["rerolls"].Integer());
        const auto index=era_bridge::mithril::safeRand(seed,0,static_cast<int>(proposed.alternatives.size())-1);
        const int chosen=proposed.alternatives[index];
        auto configured=reward->configuration;
        JsonNode identifier;
        if(proposed.kind==SHRINE)
        {
            identifier.String()=SpellID(chosen).toSpell()->getJsonKey();
            identifier.setModScope("game");configured.presetVariable("spell","gainedSpell",identifier);
        }
        else
        {
            identifier.String()=LIBRARY->skillh->getById(SecondarySkill(chosen))->getJsonKey();
            identifier.setModScope("game");configured.presetVariable("secondarySkill","gainedSkill",identifier);
        }
        GameRandomizer local(cb);local.setSeed(static_cast<int32_t>(seed));
        const auto updated=constructor->generateConfiguration(object->cb,local,object->ID,configured.variables.preset);
        gh.setRewardableObjectConfiguration(object->id,updated);
        target["rerolls"].Integer()+=1;
    }
    else if(proposed.kind==MONOLITH)
    {
        const auto exitType=object->ID==Obj::MONOLITH_ONE_WAY_ENTRANCE?Obj::MONOLITH_ONE_WAY_EXIT:Obj::MONOLITH_TWO_WAY;
        FowTilesType reveal;
        for(const auto & exit:cb.gameState().getMap().objects)
            if(exit&&exit->ID==exitType&&exit->subID==object->subID&&exit->id!=object->id)
                cb.getTilesInRange(reveal,exit->visitablePos(),2,ETileVisibility::HIDDEN,request.player);
        gh.changeFogOfWar(reveal,request.player,ETileVisibility::REVEALED);
    }
    else if(proposed.kind==SHIPYARD)
    {
        const auto position=object->visitablePos()+int3(-1,0,0);
        auto lighthouse=gh.createNewObject(position,Obj::LIGHTHOUSE,MapObjectSubID(0));
        gh.newObject(lighthouse,request.player);gh.setOwner(lighthouse.get(),request.player);
        target["lighthouse"].Bool()=true;
    }
    else if(proposed.kind==TOWN)
    {
        constexpr int kinds[]={227,222,224,226,228,229,231,46,21};
        const auto position=object->visitablePos()+(request.choice<7?int3(0,2,0):int3(2,1,0));
        if(!cb.isInTheMap(position)||!cb.isInTheMap(position+int3(1,0,0)))return false;
        auto first=gh.createNewObject(position,MapObjectID(kinds[request.choice]),MapObjectSubID(0));
        auto second=gh.createNewObject(position+int3(1,0,0),MapObjectID(kinds[request.choice]),MapObjectSubID(0));
        first->setAnchorPos(position);second->setAnchorPos(position+int3(1,0,0));
        gh.newObject(first,request.player);gh.newObject(second,request.player);
        target["townTerrain"].Integer()=request.choice;
    }
    else if(proposed.kind==DWELLING)
    {
        const auto * dwelling=dynamic_cast<const CGDwelling *>(object);
        SetAvailableCreatures change;change.tid=dwelling->id;change.creatures=dwelling->creatures;
        for(size_t i=0;i<proposed.upgrades.size();++i)
            if(proposed.upgrades[i].hasValue())change.creatures[i].second={proposed.upgrades[i]};
        gh.sendAndApply(change);
    }
    else return false;
    gh.giveResource(request.player,currency,-proposed.cost);
    EraGameplayChange change;change.system="mithril";change.state=std::move(next);gh.sendAndApply(change);
    return true;
}
}
