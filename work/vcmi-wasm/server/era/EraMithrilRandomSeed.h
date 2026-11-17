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
    if(!firstTurn||!enabled(cb)||!state(cb)["seed"].isNull())return;
    EraGameplayChange packet;packet.system="mithril";packet.state=state(cb);
    packet.state["seed"].Integer()=independentSeed();gh.sendAndApply(packet);
}
}
