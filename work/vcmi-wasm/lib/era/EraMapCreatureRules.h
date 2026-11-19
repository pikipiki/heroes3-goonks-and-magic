#pragma once
#include "EraSourceCreatureLevels.h"
#include "EraMapArmyGrowth.h"
#include "EraMapEighthUpgrades.h"
#include "EraMapNoShootingRules.h"
#include "EraMapMonthlyVisits.h"
#include "EraMapFortlessTowns.h"
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
inline BonusSourceID noShootingSource(CreatureID id)
{return BonusSourceID(BonusCustomSource(0x57500000+id.getNum()));}
inline void applyNoShooting(CGameState & gs,const JsonNode & next,const JsonNode & previous)
{
    if(!next["noShootingApplied"].Bool()||previous["noShootingApplied"].Bool())return;
    if(!next["rules"]["129"].Bool()||!next["noShooting"].isVector()||!next["noShootingExperience"].isBool())
        throw std::runtime_error("Invalid WoG no-shooting state");
    struct Change {CreatureID id;int32_t health;};
    std::vector<Change> changes;std::set<int> seen;
    for(const auto & row:next["noShooting"].Vector())
    {
        const CreatureID id(row["creature"].Integer());const auto * creature=id.toCreature();
        const auto before=row["before"].Integer(),health=row["health"].Integer();
        if(!creature||excludedCreature(creature->getJsonKey())||!seen.insert(id.getNum()).second
            ||!creature->hasBonus(Selector::type()(BonusType::SHOOTER).And(Selector::sourceTypeSel(BonusSource::CREATURE_ABILITY)))
            ||before<INT32_MIN||before>INT32_MAX||health<1||health>INT32_MAX
            ||era_campaign_creature_attributes::current(gs,id,'P')!=before
            ||era_bridge::map_rules::noShootingHealth(before)!=health)
            throw std::runtime_error("Invalid WoG no-shooting creature");
        changes.push_back({id,static_cast<int32_t>(health)});
    }
    for(const auto & change:changes)
    {
        era_campaign_creature_attributes::apply(gs,change.id,'P',change.health);
        const auto add=[&](const char * name)
        {
            auto marker=std::make_shared<Bonus>(BonusDuration::PERMANENT,BonusType::NONE,
                BonusSource::OTHER,1,noShootingSource(change.id));
            marker->stacking=name;marker->hidden=true;
            marker->limiter=std::make_shared<CCreatureTypeLimiter>(*change.id.toCreature(),false);
            gs.globalEffects.addNewBonus(marker);
        };
        add(era_bridge::map_rules::noShootingBaseMarker);
        if(next["noShootingExperience"].Bool())add(era_bridge::map_rules::noShootingExperienceMarker);
    }
}
inline void applyCreatureRules(CGameState & gs,const JsonNode & next)
{
    applyInitialFortifications(gs,next);
    applyEighthUpgrades(gs,next);
    applyArmyGrowth(gs,next);
    applyMonthlyVisits(gs,next);
    const auto & previous=gs.getMap().eraGameplayState["mapRules"];
    applyGroundedFliers(gs,next,previous);
    applyNoShooting(gs,next,previous);
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
