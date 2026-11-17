#pragma once
#include "EraHenchmanModel.h"
#include "../CStack.h"

namespace era_compat::henchmen
{
inline era_bridge::henchmen::BannerStyle battleBanner(const CStack & stack)
{
    using Style=era_bridge::henchmen::BannerStyle;
    if(stack.unitSlot()!=SlotID::HENCHMAN_SLOT_PLACEHOLDER)return Style::NONE;
    const auto * hero=stack.getMyHero();
    if(!hero||!hero->cb||!enabled(*hero->cb)
        ||!hero->cb->getSettings().getBoolean(EGameSettings::MODULE_STACK_EXPERIENCE)
        ||!settings(*hero->cb).banner)return Style::NONE;
    const auto style=bannerStyle(*hero);
    return era_bridge::henchmen::validBannerStyle(style)?static_cast<Style>(style):Style::NONE;
}
}
