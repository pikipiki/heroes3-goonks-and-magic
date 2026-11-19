#pragma once
#include "../CGameHandler.h"
#include "EraMithrilSiteTiles.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/era/EraMithrilWeeklyRules.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include "../../lib/callback/GameRandomizer.h"
#include "../../lib/rewardable/Reward.h"
#include "../../lib/rewardable/Configuration.h"

namespace era_compat::mithril
{
inline void weeklySites(CGameHandler & gh)
{
    initializeSiteMarkers(gh);
    const auto & cb=gh.gameInfo();const int day=cb.getDate(Date::DAY);
    if(!era_bridge::mithril::weeklyDue(day,state(cb)["weeklyProcessedDay"].Integer(),weeklyEnabled(cb)))return;
    const auto mithril=resource();if(mithril==GameResID::NONE)return;
    // Source171 enumerates all gardens, then water wheels, then windmills.
    for(const auto type:{Obj::MYSTICAL_GARDEN,Obj::WATER_WHEEL,Obj::WINDMILL})
    {
        std::vector<const CRewardableObject *> sites;
        for(const auto & object:gh.gameState().getMap().getObjects())
            if(object&&object->ID==type)
                if(const auto * site=dynamic_cast<const CRewardableObject *>(object))sites.push_back(site);
        std::sort(sites.begin(),sites.end(),[](const auto * a,const auto * b)
        {
            const auto pa=a->visitablePos(),pb=b->visitablePos();
            return era_bridge::mithril::sourceSiteLess({pa.x,pa.y,pa.z,a->id.getNum()},{pb.x,pb.y,pb.z,b->id.getNum()});
        });
        for(const auto * site:sites)
        {
            const bool replace=type!=Obj::WATER_WHEEL&&era_bridge::mithril::weeklyMithril(gh.getRandomGenerator().nextInt(1,12));
            const bool upgraded=millActive(cb,site->id);
            if(!replace&&!upgraded)continue;
            auto next=site->configuration;
            for(auto & visit:next.info)
            {
                if(visit.visitType!=Rewardable::EEventType::EVENT_FIRST_VISIT)continue;
                auto & resources=visit.reward.resources;
                if(type==Obj::MYSTICAL_GARDEN&&replace)
                {
                    // GD:B changes resource identity; the original garden
                    // yields five of a non-gold resource.
                    resources=ResourceSet();resources[mithril]=5;
                }
                else if(type==Obj::WINDMILL)
                {
                    if(replace)
                    {
                        int amount=0;for(const auto value:resources)if(value){amount=value;break;}
                        resources=ResourceSet();resources[mithril]=amount;
                    }
                    if(upgraded)for(auto & amount:resources)amount=era_bridge::mithril::doubleWeeklyStock(amount);
                }
                else if(type==Obj::WATER_WHEEL&&upgraded)
                    // Original stock resets to one unit in week1, two later;
                    // WM:B units are500 gold. Never compound or draw RNG to
                    // regenerate a native configurable-object template.
                    resources[GameResID::GOLD]=day<=7?1000:2000;
            }
            gh.setRewardableObjectConfiguration(site->id,next);
        }
    }
    EraGameplayChange packet;packet.system="mithril";packet.state=state(cb);packet.state["weeklyProcessedDay"].Integer()=day;
    gh.sendAndApply(packet);
}
}
