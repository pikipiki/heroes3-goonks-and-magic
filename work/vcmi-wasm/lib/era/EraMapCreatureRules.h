#pragma once
#include "EraSourceCreatureLevels.h"
#include "EraMapArmyGrowth.h"
#include "EraMapMonthlyVisits.h"
#include "EraCampaignCreatureAttributes.h"
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
inline BonusSourceID flightDisabledSource(CreatureID id)
{return BonusSourceID(BonusCustomSource(0x57400000+id.getNum()));}
inline bool flightAlreadyDisabled(const CGameState & gs,CreatureID id)
{
    const auto & bonuses=gs.globalEffects.getExportedBonusList();
    return std::any_of(bonuses.begin(),bonuses.end(),[&](const auto & bonus)
    {
        return bonus->source==BonusSource::OTHER&&bonus->sid==flightDisabledSource(id)
            &&bonus->type==BonusType::NONE&&bonus->val==1&&bonus->hidden
            &&bonus->stacking=="eraCampaign:flightDisabled:v1";
    });
}
inline void applyGroundedFliers(CGameState & gs,const JsonNode & next,const JsonNode & previous)
{
    if(!next["groundedFliersApplied"].Bool()||previous["groundedFliersApplied"].Bool())return;
    for(const auto & row:next["groundedFliers"].Vector())
    {
        const CreatureID id(row.Integer());const auto * creature=id.toCreature();
        if(!creature||excludedCreature(creature->getJsonKey()))
            throw std::runtime_error("Invalid WoG grounded flier");
        auto marker=std::make_shared<Bonus>(BonusDuration::PERMANENT,BonusType::NONE,
            BonusSource::OTHER,1,flightDisabledSource(id));
        marker->stacking="eraCampaign:flightDisabled:v1";marker->hidden=true;
        marker->limiter=std::make_shared<CCreatureTypeLimiter>(*creature,false);
        gs.globalEffects.addNewBonus(marker);
        auto noRetaliation=std::make_shared<Bonus>(BonusDuration::PERMANENT,BonusType::BLOCKS_RETALIATION,
            BonusSource::CREATURE_ABILITY,1,BonusSourceID());
        noRetaliation->valType=BonusValueType::INDEPENDENT_MAX;
        noRetaliation->limiter=std::make_shared<CCreatureTypeLimiter>(*creature,false);
        gs.globalEffects.addNewBonus(noRetaliation);
    }
}
inline void applyCreatureRules(CGameState & gs,const JsonNode & next)
{
    applyArmyGrowth(gs,next);
    applyMonthlyVisits(gs,next);
    const auto & previous=gs.getMap().eraGameplayState["mapRules"];
    applyGroundedFliers(gs,next,previous);
    if(next["invertedSpeedsApplied"].Bool()&&!previous["invertedSpeedsApplied"].Bool())
        for(const auto & row:next["invertedSpeeds"].Vector())
            era_campaign_creature_attributes::apply(gs,CreatureID(row["creature"].Integer()),'S',row["speed"].Integer());
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
