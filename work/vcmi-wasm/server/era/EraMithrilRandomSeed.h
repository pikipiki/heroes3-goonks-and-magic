#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraMithrilModel.h"
#include "../../lib/era/EraMithrilRandomRules.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
#include <random>

namespace era_compat::mithril
{
inline uint32_t independentSeed()
{
    // FastRand.Rng is seeded from four SecureRng words, independently of
    // Heroes.RandomRange. Replicate the resulting seed, never OS entropy.
    std::random_device entropy;
    std::array<uint32_t,4> words;
    for(auto & word:words)word=static_cast<uint32_t>(entropy());
    era_bridge::mithril::ShrineRandom random(words);
    return static_cast<uint32_t>(random.range(11,55));
}
inline void initializeSeed(CGameHandler & gh,bool firstTurn)
{
    const auto & cb=gh.gameInfo();
    const bool active=enabled(cb);
    const bool createSeed=firstTurn&&active&&state(cb)["seed"].isNull();
    const bool createWeeklyPolicy=state(cb)["weeklyRuleVersion"].isNull();
    const bool createReplacementPolicy=state(cb)["replacementRuleVersion"].isNull();
    if(state(cb)["enabled"].isBool()&&!createSeed&&!createWeeklyPolicy&&!createReplacementPolicy)return;
    EraGameplayChange packet;packet.system="mithril";packet.state=state(cb);
    packet.state["enabled"].Bool()=active;
    if(createWeeklyPolicy)
    {
        // Existing saves retain the old mill adapter. Newly started games
        // freeze source171 independently of the source36 purchase choice.
        packet.state["weeklyRuleVersion"].Integer()=firstTurn?1:0;
        packet.state["weeklyEnabled"].Bool()=firstTurn&&era_bridge::wogOptionEnabled(cb,
            era_bridge::WogOption::MithrilWeeklySites,
            cb.getSettings().getBoolean(EGameSettings::MODULE_MITHRIL_ENHANCEMENTS));
    }
    if(createReplacementPolicy)
    {
        packet.state["replacementRuleVersion"].Integer()=firstTurn?1:0;
        packet.state["replacementEnabled"].Bool()=firstTurn&&era_bridge::wogOptionEnabled(cb,
            era_bridge::WogOption::MithrilResourceReplacement,
            cb.getSettings().getBoolean(EGameSettings::MODULE_MITHRIL_ENHANCEMENTS));
    }
    if(createSeed)packet.state["seed"].Integer()=independentSeed();
    gh.sendAndApply(packet);
}
}
