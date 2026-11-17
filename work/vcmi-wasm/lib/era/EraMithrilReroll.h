#pragma once
#include "../rewardable/Configuration.h"
#include "../networkPacks/Component.h"
#include "../CSkillHandler.h"
#include "../spells/CSpellHandler.h"

namespace era_compat::mithril
{
inline void rerollText(MetaString & text,const std::string & previous,const std::string & chosen)
{
    JsonNode serialized;text.jsonSerialize(serialized);
    for(auto & item:serialized["stringsTextID"].Vector())
        if(item.String()==previous)item.String()=chosen;
    text.jsonDeserialize(serialized);
}
inline void rerollLimiter(Rewardable::Limiter & limiter,bool spell,int previous,int chosen)
{
    if(spell)
    {
        std::replace(limiter.spells.begin(),limiter.spells.end(),SpellID(previous),SpellID(chosen));
        std::replace(limiter.canLearnSpells.begin(),limiter.canLearnSpells.end(),SpellID(previous),SpellID(chosen));
    }
    else if(const auto entry=limiter.secondary.find(SecondarySkill(previous));entry!=limiter.secondary.end())
    {
        const int mastery=entry->second;limiter.secondary.erase(entry);
        auto & required=limiter.secondary[SecondarySkill(chosen)];required=std::max(required,mastery);
    }
    for(auto * list:{&limiter.allOf,&limiter.anyOf,&limiter.noneOf})
        for(auto & child:*list)
            if(child)
            {
                child=std::make_shared<Rewardable::Limiter>(*child);
                rerollLimiter(*child,spell,previous,chosen);
            }
}
// Change the offering in place: re-generating the object also re-rolls unrelated
// rewards, guards and variables, and discards per-instance configuration.
inline Rewardable::Configuration rerollOffering(const Rewardable::Configuration & original,bool spell,int previous,int chosen)
{
    auto result=original;
    const auto previousName=spell?SpellID(previous).toSpell()->getNameTextID():LIBRARY->skillh->getById(SecondarySkill(previous))->getNameTextID();
    const auto chosenName=spell?SpellID(chosen).toSpell()->getNameTextID():LIBRARY->skillh->getById(SecondarySkill(chosen))->getNameTextID();
    JsonNode identifier;identifier.String()=spell?SpellID(chosen).toSpell()->getJsonKey():LIBRARY->skillh->getById(SecondarySkill(chosen))->getJsonKey();identifier.setModScope("game");
    result.presetVariable(spell?"spell":"secondarySkill",spell?"gainedSpell":"gainedSkill",identifier);
    result.initVariable(spell?"spell":"secondarySkill",spell?"gainedSpell":"gainedSkill",chosen);
    rerollLimiter(result.visitLimiter,spell,previous,chosen);
    for(auto * text:{&result.onSelect,&result.description,&result.notVisitedTooltip,&result.visitedTooltip})rerollText(*text,previousName,chosenName);
    for(auto & info:result.info)
    {
        rerollLimiter(info.limiter,spell,previous,chosen);
        if(spell)std::replace(info.reward.spells.begin(),info.reward.spells.end(),SpellID(previous),SpellID(chosen));
        else if(const auto entry=info.reward.secondary.find(SecondarySkill(previous));entry!=info.reward.secondary.end())
        {
            const int mastery=entry->second;info.reward.secondary.erase(entry);info.reward.secondary[SecondarySkill(chosen)]+=mastery;
        }
        for(auto & component:info.reward.extraComponents)
            if(component.type==(spell?ComponentType::SPELL:ComponentType::SEC_SKILL)&&component.subType.getNum()==previous)
                component.subType=spell?ComponentSubType(SpellID(chosen)):ComponentSubType(SecondarySkill(chosen));
        rerollText(info.message,previousName,chosenName);rerollText(info.description,previousName,chosenName);
    }
    return result;
}
}
