#pragma once
#include "EraHenchmanRules.h"
#include "../IGameSettings.h"
#include "../callback/IGameInfoCallback.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../entities/artifact/ArtifactUtils.h"
#include "../entities/artifact/CArtifactFittingSet.h"

namespace era_compat::henchmen
{
inline bool enabled(const IGameInfoCallback & cb)
{return cb.getSettings().getBoolean(EGameSettings::MODULE_HENCHMEN);}
inline bool emissary(const Creature & creature)
{
    const auto key=creature.getJsonKey();
    return key=="wake-of-gods.messengersandemissaries:emissaryOfWar"
        ||key=="wake-of-gods.messengersandemissaries:emissaryOfPeace"
        ||key=="wake-of-gods.messengersandemissaries:emissaryOfMana"
        ||key=="wake-of-gods.messengersandemissaries:emissaryOfLore";
}
inline std::vector<era_bridge::henchmen::Candidate> candidates(const CGHeroInstance & hero)
{
    std::vector<era_bridge::henchmen::Candidate> result(7);
    for(const auto & [slot,stack]:hero.Slots())
    {
        if(!slot.validSlot())continue;
        const auto * creature=stack->getType();
        result[slot.getNum()]={stack->getId().getNum(),static_cast<int32_t>(stack->getCount()),
            creature->getBaseShots(),creature->getFightValue(),emissary(*creature),!emissary(*creature)};
    }
    return result;
}
inline era_bridge::henchmen::Progress progress(const CGHeroInstance & hero,int day)
{
    const auto * creature=hero.henchman.stack->getType();
    const era_bridge::henchmen::Settings settings;
    return era_bridge::henchmen::progress(hero.henchman.experience,hero.level,std::max(1,day),
        era_bridge::henchmen::levelRate(creature->getFightValue(),creature->getAIValue(),settings),settings);
}
// Return the last unit's equipment before its army stack is removed. Plan all
// moves first so a full hero backpack cannot consume a unit or lose an artifact.
inline std::optional<std::vector<std::pair<ArtifactPosition,ArtifactPosition>>> equipmentReturn(
    const CGHeroInstance & hero,const CStackInstance & chosen)
{
    std::vector<std::pair<ArtifactPosition,ArtifactPosition>> result;
    CArtifactFittingSet fitting(hero);
    const auto plan=[&](ArtifactPosition source,const ArtSlotInfo & info)
    {
        if(info.locked)return true;
        const auto * artifact=info.getArt();
        if(!artifact)return true;
        const auto destination=ArtifactUtils::getArtBackpackPosition(&fitting,artifact->getTypeId());
        if(destination==ArtifactPosition::PRE_FIRST)return false;
        fitting.putArtifact(destination,artifact);result.emplace_back(source,destination);return true;
    };
    for(const auto & [position,info]:chosen.artifactsWorn)
        if(!plan(position,info))return std::nullopt;
    for(size_t i=chosen.artifactsInBackpack.size();i>0;--i)
        if(!plan(ArtifactPosition::BACKPACK_START+i-1,chosen.artifactsInBackpack[i-1]))return std::nullopt;
    return result;
}
inline bool canSelect(const CGHeroInstance & hero,int slot)
{
    const SlotID index(slot);
    if(!index.validSlot()||!hero.hasStackAtSlot(index))return false;
    const auto & chosen=hero.getStack(index);
    if(chosen.getCount()<1||emissary(*chosen.getType()))return false;
    if(!era_bridge::henchmen::eligible(candidates(hero),false,hero.henchman.stack&&hero.henchman.alive))return false;
    if(chosen.getCount()==1&&!equipmentReturn(hero,chosen))return false;
    return !(hero.henchman.stack&&hero.henchman.alive&&chosen.getCount()>1
        &&!hero.getSlotFor(hero.henchman.stack->getId()).validSlot());
}
inline era_bridge::henchmen::Stats stats(const CGHeroInstance & hero,int day)
{
    const auto * creature=hero.henchman.stack->getType();
    const auto rate=era_bridge::henchmen::levelRate(creature->getFightValue(),creature->getAIValue(),{});
    return era_bridge::henchmen::additionalStats({creature->getAttack(false),creature->getDefense(false),
        creature->getMinDamage(false),creature->getMaxDamage(false),static_cast<int32_t>(creature->getMaxHealth()),
        creature->getInitiative()},progress(hero,day).experience,rate);
}
}
