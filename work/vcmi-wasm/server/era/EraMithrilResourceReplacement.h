#pragma once
#include "../CGameHandler.h"
#include "SourceCampaignProcessor.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/era/EraMithrilReplacementRules.h"
#include "../../lib/mapObjects/CGResource.h"
#include "../../lib/mapObjectConstructors/CObjectClassesHandler.h"
#include "../../lib/mapObjectConstructors/CommonConstructors.h"
#include "../../lib/rewardable/Configuration.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/callback/GameRandomizer.h"
#include <algorithm>
#include <vector>

namespace era_compat::mithril
{
inline void clearReplacementGlobals(CGameHandler & gh,bool active)
{
    for(const auto name:{"wog_170_79_maxStep","wog_170_12_maxStep","wog_170_79_interval","wog_170_12_interval"})
        gh.sourceCampaigns->setNamedInteger(name,0);
    if(active)for(const auto name:{"wog_170_79_num","wog_170_12_num"})
        gh.sourceCampaigns->setNamedInteger(name,0); // source NULL=0
}
inline void replaceResources(CGameHandler & gh)
{
    const auto & cb=gh.gameInfo();
    if(state(cb)["replacementRuleVersion"].Integer()<1||state(cb)["replacementProcessed"].Bool())return;
    const bool shared=gh.sourceCampaigns->preservesAuthoredObjects();
    if(!resourceReplacementEnabled(cb))
    {
        // Script42's first cleanup is unconditional; its later NUM cleanup
        // is gated by170. The distinct36 interval names are left untouched.
        EraGameplayChange packet;packet.system="mithril";packet.state=state(cb);packet.state["replacementProcessed"].Bool()=true;
        gh.sendAndApply(packet);if(shared)clearReplacementGlobals(gh,false);return;
    }
    const auto mithril=resource();if(mithril==GameResID::NONE)return;
    MapObjectSubID mithrilPile;
    bool foundPile=false;
    for(const auto subtype:LIBRARY->objtypeh->knownSubObjects(Obj::RESOURCE))
    {
        const auto handler=std::dynamic_pointer_cast<ResourceInstanceConstructor>(LIBRARY->objtypeh->getHandlerFor(Obj::RESOURCE,subtype));
        if(handler&&handler->getResourceType()==mithril){mithrilPile=subtype;foundPile=true;break;}
    }
    if(!foundPile)return;
    const std::string resourceCounter="wog_36_79_interval",campfireCounter="wog_36_12_interval";
    const auto readCounter=[&](const std::string & name)
    {return shared?gh.sourceCampaigns->namedInteger(name):static_cast<int32_t>(state(cb)["sourceIntegers"][name].Integer());};
    auto resourceInterval=readCounter(resourceCounter),campfireInterval=readCounter(campfireCounter);
    std::vector<const CGObjectInstance *> sites;
    for(const auto * object:gh.gameState().getMap().getObjects())
        if(object&&(object->ID==Obj::RESOURCE||object->ID==Obj::CAMPFIRE))
        {
            const auto position=object->visitablePos();
            if(gh.gameState().isInTheMap(position)&&gh.gameState().getMap().getTile(position).topVisitableObj()==object->id)sites.push_back(object);
        }
    // WOG_OnIterateAllMapObjects scans every yellow square by z/y/x.
    // This is distinct from source171's UN:U diagonal object enumeration.
    std::sort(sites.begin(),sites.end(),[](const auto * a,const auto * b)
    {
        const auto pa=a->visitablePos(),pb=b->visitablePos();
        return era_bridge::mithril::replacementSiteLess({pa.x,pa.y,pa.z,a->id.getNum()},{pb.x,pb.y,pb.z,b->id.getNum()});
    });
    for(const auto * object:sites)
    {
        const bool pile=object->ID==Obj::RESOURCE;
        auto & interval=pile?resourceInterval:campfireInterval;
        bool placed=false;
        if(interval<=0&&pile)
        {
            const auto * resourceObject=dynamic_cast<const CGResource *>(object);
            if(resourceObject)
            {
                const auto kind=resourceObject->resourceID();const int source=kind==mithril?7:kind.getNum()<7?kind.getNum():-1;
                const auto amount=era_bridge::mithril::replacementAmount(source,resourceObject->getAmount());
                if(amount)
                {
                    const auto position=object->visitablePos();const auto oldId=object->id;
                    auto created=gh.createNewObject(position,Obj::RESOURCE,mithrilPile);
                    auto * newResource=dynamic_cast<CGResource *>(created.get());
                    if(!newResource)throw std::runtime_error("Mithril resource handler did not create a resource pile");
                    newResource->setAmount(*amount);
                    RemoveObject remove;remove.objectID=oldId;remove.initiator=PlayerColor::NEUTRAL;gh.sendAndApply(remove);
                    gh.newObject(created,PlayerColor::NEUTRAL);placed=true;
                }
            }
        }
        else if(interval<=0)
        {
            if(const auto * campfire=dynamic_cast<const CRewardableObject *>(object))
            {
                auto configuration=campfire->configuration;
                for(auto & visit:configuration.info)
                    if(visit.visitType==Rewardable::EEventType::EVENT_FIRST_VISIT)
                    {
                        auto & resources=visit.reward.resources;
                        for(std::size_t i=0;i<resources.size();++i)
                            if(i!=static_cast<std::size_t>(GameResID::GOLD)&&resources[i]!=0)
                            {
                                const auto amount=resources[i];resources[i]=0;resources[mithril]=amount;placed=true;break;
                            }
                    }
                if(placed)gh.setRewardableObjectConfiguration(campfire->id,configuration);
            }
        }
        interval=era_bridge::mithril::replacementCounter(interval,placed,placed?gh.getRandomGenerator().nextInt(0,35):0);
    }
    EraGameplayChange packet;packet.system="mithril";packet.state=state(cb);
    packet.state["sourceIntegers"][resourceCounter].Integer()=resourceInterval;
    packet.state["sourceIntegers"][campfireCounter].Integer()=campfireInterval;
    packet.state["replacementProcessed"].Bool()=true;gh.sendAndApply(packet);
    if(shared)
    {
        gh.sourceCampaigns->setNamedInteger(resourceCounter,resourceInterval);
        gh.sourceCampaigns->setNamedInteger(campfireCounter,campfireInterval);
        // The source clears its170 namespace afterwards, not the36 intervals.
        clearReplacementGlobals(gh,true);
    }
}
}
