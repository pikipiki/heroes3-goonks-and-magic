#pragma once
#include "EraHenchmanRules.h"
#include "../json/JsonNode.h"
#include <charconv>

namespace era_compat::henchmen
{
using HenchmanSettings=era_bridge::henchmen::Settings;
inline constexpr std::pair<const char *,int32_t HenchmanSettings::*> integerSettings[]={
    {"battleExpStatic",&HenchmanSettings::battleStatic},{"battleExpRandom",&HenchmanSettings::battleRandom},
    {"battleHeroExpCoef",&HenchmanSettings::battleHeroCoefficient},{"battleExpPerHeroLv",&HenchmanSettings::battlePerHeroLevel},
    {"battleExpMin",&HenchmanSettings::battleMinimum},{"battleExpMax",&HenchmanSettings::battleMaximum},
    {"bonusHeroLvUp",&HenchmanSettings::heroLevelBonus},{"bonusDaily",&HenchmanSettings::dailyBonus},
    {"battleExpLossPct",&HenchmanSettings::replacementLossPercent},{"battleExpAIPct",&HenchmanSettings::aiPercent},
    {"bonusSpellDmgPerPwr",&HenchmanSettings::spellDamagePerPower},{"moreSpellEveryXKnl",&HenchmanSettings::knowledgePerExtraSpell}
};
inline constexpr std::pair<const char *,bool HenchmanSettings::*> booleanSettings[]={
    {"stackExpEnabled",&HenchmanSettings::stackExperience},{"bannerEnabled",&HenchmanSettings::banner},
    {"bannerFree",&HenchmanSettings::freeBanner},{"returnToArmy",&HenchmanSettings::returnToArmy},
    {"altExpPerLv",&HenchmanSettings::alternativeLevelRate},{"campaignTransfer",&HenchmanSettings::campaignTransfer},
    {"moreSantaGuards",&HenchmanSettings::moreSantaGuards},{"reviveAnywhere",&HenchmanSettings::reviveAnywhere}
};
inline int32_t settingInteger(const JsonNode & node,int32_t fallback)
{
    if(node.isNumber())return era_bridge::henchmen::word(node.Integer());
    if(node.isBool())return node.Bool()?1:0;
    if(node.isString())
    {
        const auto & text=node.String();
        if(text=="TRUE")return 1;
        if(text=="FALSE")return 0;
        int64_t value=0;const auto parsed=std::from_chars(text.data(),text.data()+text.size(),value);
        if(parsed.ec==std::errc()&&parsed.ptr==text.data()+text.size())return era_bridge::henchmen::word(value);
    }
    return fallback;
}
inline HenchmanSettings settingsFromJson(const JsonNode & source)
{
    HenchmanSettings result;
    for(const auto & [name,member]:integerSettings)result.*member=settingInteger(source[name],result.*member);
    for(const auto & [name,member]:booleanSettings)result.*member=std::clamp(settingInteger(source[name],result.*member),0,1)!=0;
    result.normalize();return result;
}
inline JsonNode settingsToJson(const HenchmanSettings & settings)
{
    JsonNode result;
    for(const auto & [name,member]:integerSettings)result[name].Integer()=settings.*member;
    for(const auto & [name,member]:booleanSettings)result[name].Bool()=settings.*member;
    return result;
}
}
