/* TUM ERM daily evolution runs after all native OnEveryDay plugin handlers. */
#pragma once
#include "../../lib/era/EraDragonlingEvolution.h"
#include "../CGameHandler.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/networkPacks/PacksForClient.h"
#include <algorithm>
VCMI_LIB_NAMESPACE_BEGIN
inline void applyEraDragonlingEvolutionDay(CGameHandler & handler,const PlayerState & player)
{
    const auto & policy=era_compat::DragonlingEvolution::get();
    auto heroes=player.getHeroes();
    // Source enumerated the original156 hero records; native/Goonk extends that
    // record space. Preserve deterministic record order across all native heroes.
    std::sort(heroes.begin(),heroes.end(),[](const auto * left,const auto * right)
    {
        if(left->getHeroTypeID()!=right->getHeroTypeID())return left->getHeroTypeID()<right->getHeroTypeID();
        return left->id<right->id;
    });
    for(const auto * hero:heroes)
    {
        if(hero->getOwner()!=player.color)continue;
        for(int slot=0;slot<7;++slot)
        {
            const SlotID armySlot(slot);
            if(!hero->hasStackAtSlot(armySlot))continue;
            const auto * stack=hero->getStackPtr(armySlot);
            const int target=policy.target(stack->getId().getNum(),stack->getExpRank());
            if(target<0)continue;
            const auto oldName=stack->getCreature()->getNamePluralTranslated();
            const auto count=stack->getCount();
            SetStackType type;
            type.army=hero->id;type.slot=armySlot;type.type=CreatureID(target);
            type.preserveExperience=true;
            handler.sendAndApply(type);
            ResetStackExperience reset;
            reset.army=hero->id;reset.slot=armySlot;reset.expectedType=type.type;
            handler.sendAndApply(reset);
            if(player.human)
            {
                InfoWindow message;message.player=hero->getOwner();
                message.text.appendRawString("Les "+oldName+" de "+hero->getNameTranslated()
                    +" ont grandi : "+type.type.toCreature()->getNamePluralTranslated()+". Leur expérience repart de zéro.");
                message.components.emplace_back(ComponentType::CREATURE,type.type,count);
                handler.sendAndApply(message);
            }
        }
    }
}
VCMI_LIB_NAMESPACE_END
