/* Warlord's Banner arithmetic from WoG crexpo.cpp (GPL-2.0-or-later).
 * Source: CrExpBon::Apply, ReduceDefence, StackBlockPartial and Apply2.
 * These helpers consume the resolved EA row, including its rank value;
 * they deliberately do not infer an EA row from a VCMI bonus.
 */
#pragma once

#include "EraHenchmanRules.h"

namespace era_bridge::henchmen
{
enum class BannerStyle : std::int32_t
{
    NONE=-1, HEALTH=0, ATTACK=1, DEFENCE=2, DAMAGE=3, SPEED=4,
    EXPERIENCE=5, DEFENCE_REDUCTION=6, PARTIAL_BLOCK=7, RETALIATIONS=8
};

inline bool validBannerStyle(std::int32_t style)
{ return style>=-1&&style<=8; }

// ApplyMod's x87 arithmetic is stored through a float pointer. Preserve the
// binary32 input/output boundary with an extended intermediate, as in the
// independently corroborated sourceExperienceHealth adapter. '%' adds 0.5
// even for negative values; it is not std::round.
inline float applyExperienceModifier(float value,char modifier,std::int32_t amount)
{
    switch(modifier)
    {
        case '+': return value+static_cast<float>(amount);
        case '-': return value-static_cast<float>(amount);
        case '%': return static_cast<float>(static_cast<double>(value)
            +(static_cast<double>(value)*amount/100.0+0.5));
        case '=': return static_cast<float>(amount);
        default: return value;
    }
}

inline bool bannerMatchesScalarRow(BannerStyle style,char row)
{
    return (style==BannerStyle::HEALTH&&row=='H')
        ||(style==BannerStyle::ATTACK&&row=='A')
        ||(style==BannerStyle::DEFENCE&&row=='D')
        ||(style==BannerStyle::DAMAGE&&(row=='M'||row=='m'))
        ||(style==BannerStyle::SPEED&&row=='S');
}

// No matching EA row means no scalar banner bonus, including its flat part.
// The caller must use the cached original BF stat for every recalculation;
// EA:E followed by EA:R must not apply the row twice.
inline std::int32_t experienceScalarRow(std::int32_t original,char row,
    char modifier,std::int32_t amount,BannerStyle style)
{
    const bool doubled=bannerMatchesScalarRow(style,row);
    float value=applyExperienceModifier(static_cast<float>(original),modifier,
        doubled?mul(amount,2):amount);
    if(doubled)value+=(row=='M'||row=='m'||row=='S')?1.0f:2.0f;
    return static_cast<std::int32_t>(value);
}

inline std::int32_t bannerRetaliations(std::int32_t base,std::int32_t counterstrike,
    BannerStyle style)
{ return add(add(base,counterstrike),style==BannerStyle::RETALIATIONS?2:0); }

// The first active 'b' row wins in ReduceDefence. Intrinsic creature defence
// reduction is a separate engine step and must not be folded into this value.
inline std::int32_t bannerReducedDefence(std::int32_t defence,bool hasRow,
    char modifier,std::int32_t amount,BannerStyle style)
{
    if(!hasRow)return style==BannerStyle::DEFENCE_REDUCTION
        ?static_cast<std::int32_t>(defence*0.75):defence;
    float reduction=std::max(0.0f,applyExperienceModifier(0.0f,modifier,amount));
    if(style==BannerStyle::DEFENCE_REDUCTION)reduction+=25.0f;
    reduction=std::min(100.0f,reduction);
    return static_cast<std::int32_t>(defence*(100.0f-reduction)/100.0f);
}

// Source rolls the EA partial block first, then an independent 25% banner
// roll. When both trigger, the stronger reduction wins. Inputs are the two
// already-drawn, inclusive 1..100 values, so RNG ownership stays in the engine.
inline std::int32_t bannerPartialBlockPercent(std::int32_t rowChance,
    std::int32_t rowReduction,std::int32_t rowRoll,std::int32_t bannerRoll,
    BannerStyle style)
{
    std::int32_t reduction=rowChance>0&&rowRoll<=rowChance?rowReduction:0;
    if(style==BannerStyle::PARTIAL_BLOCK&&bannerRoll<=25)
        reduction=std::max(reduction,50);
    return reduction;
}

// Initialization grants health style once. Returning a banner sets NONE;
// opening the dialog or replacing/resurrecting the henchman grants nothing.
inline BannerStyle initialBanner(const Settings & settings)
{ return settings.banner&&settings.stackExperience&&settings.freeBanner
    ?BannerStyle::HEALTH:BannerStyle::NONE; }

// The source campaign INI writes only >0; health style is therefore restored
// by free initialization, whereas a returned banner remains absent only when
// the transferred runtime variable itself survives the scenario transition.
inline bool bannerWrittenToCampaignIni(BannerStyle style,const Settings & settings)
{ return settings.campaignTransfer&&settings.freeBanner
    &&static_cast<std::int32_t>(style)>0; }
}
