#pragma once
#include "EraHenchmanModel.h"
#include "EraHenchmanBannerSourceRows.h"
#include "../CPlayerState.h"
#include "../StartInfo.h"

namespace era_compat::henchmen
{
inline std::unique_ptr<CStackInstance> battleExperienceBase(const CStackInstance & stored)
{
    const auto * hero=dynamic_cast<const CGHeroInstance *>(stored.getArmy());
    if(!hero||!hero->cb||!enabled(*hero->cb)||!settings(*hero->cb).stackExperience
        ||!hero->cb->getSettings().getBoolean(EGameSettings::MODULE_STACK_EXPERIENCE))return {};
    const auto id=era_bridge::sourceCreatureIdForLevel(stored.getType()->getJsonKey());
    const auto * table=id?era_bridge::henchmen::sourceExperienceTable(*id):nullptr;
    if(!table)return {};
    const auto * owner=hero->cb->getPlayerState(hero->getOwner());
    const auto * start=hero->cb->getStartInfo();
    if(!owner||!start)throw std::runtime_error("Henchman battlefield experience needs owner and difficulty");
    const auto experience=era_bridge::henchmen::battlefieldStackExperience(
        era_bridge::henchmen::word(stored.getAverageExperience()),!owner->isHuman(),start->difficulty,*table);
    if(experience==stored.getAverageExperience())return {};
    // EA:E in hench_StackExpBF changes only the summoned battlefield actor.
    // A separate base lets all rank-dependent bonuses and hooks observe that
    // value while the hero's saved companion retains its original experience.
    auto result=std::make_unique<CStackInstance>(hero->cb,stored.getId(),1);
    result->restoreExperience(experience);
    result->setArmy(const_cast<CArmedInstance *>(stored.getArmy()));
    return result;
}
}
