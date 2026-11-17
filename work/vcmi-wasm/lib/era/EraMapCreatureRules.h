#pragma once
#include "EraSourceCreatureLevels.h"
#include "../GameLibrary.h"
#include "../CCreatureHandler.h"
#include "../bonuses/Limiters.h"
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"

namespace era_compat::map_rules
{
inline bool excludedCreature(std::string_view key)
{
    const auto id=era_bridge::sourceCreatureIdForLevel(key);
    return key.find("wake-of-gods.commanders:")==0
        ||(id&&((*id>=145&&*id<=149)||(*id>=174&&*id<=191)
            ||*id==122||*id==124||*id==126||*id==128));
}
inline TLimiterPtr creatureRuleLimiter()
{
    auto excluded=std::make_shared<NoneOfLimiter>();
    LIBRARY->creatures()->forEach([&](const Creature * creature,bool &)
    {
        if(!excludedCreature(creature->getJsonKey()))return;
        auto limiter=std::make_shared<CCreatureTypeLimiter>();
        limiter->setCreature(creature->getId());excluded->add(limiter);
    });
    auto result=std::make_shared<AllOfLimiter>();
    result->add(std::make_shared<CreatureLevelLimiter>());
    result->add(excluded);return result;
}
inline void applyCreatureRules(CGameState & gs,const JsonNode & next)
{
    const auto & previous=gs.getMap().eraGameplayState["mapRules"];
    const auto add=[&](const char * code,BonusType type)
    {
        if(!next["rules"][code].Bool()||previous["rules"][code].Bool())return;
        auto bonus=std::make_shared<Bonus>(BonusDuration::PERMANENT,type,BonusSource::CREATURE_ABILITY,1,BonusSourceID());
        bonus->valType=BonusValueType::INDEPENDENT_MAX;
        bonus->addLimiter(creatureRuleLimiter());gs.globalEffects.addNewBonus(bonus);
    };
    add("115",BonusType::ADDITIONAL_ATTACK);
    add("128",BonusType::TWO_HEX_ATTACK_BREATH);
}
}
