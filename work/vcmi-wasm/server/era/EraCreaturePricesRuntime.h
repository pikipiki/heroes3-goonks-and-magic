/* Source77 rule113 price-table transitions; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraCreaturePrices.h"
#include "../../lib/era/EraCreaturePriceRules.h"
#include "../../lib/era/EraSourceCreatureLevels.h"
#include "../../lib/era/EraMapRulesModel.h"
#include "../../lib/CPlayerState.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"

namespace era_compat::creature_prices
{
inline void playerTurn(CGameHandler & gh,PlayerColor player)
{
    if(!map_rules::state(gh.gameInfo())["rules"]["113"].Bool())return;
    const int day=gh.gameInfo().getDate(Date::DAY);
    if(day<=1)return;
    const bool desired=::era_bridge::creature_prices::wantsHalf(day,
        gh.gameInfo().getPlayerState(player)->isHuman(),gh.gameInfo().getDate(Date::DAY_OF_WEEK));
    auto next=state(gh.gameInfo());
    if(next.isNull())
    {
        next["version"].Integer()=1;next["halfApplied"].Bool()=false;next["values"].Struct();
    }
    if(next["halfApplied"].Bool()==desired)return;
    LIBRARY->creatures()->forEach([&](const Creature * entry,bool &)
    {
        const auto id=entry->getId();
        const auto * creature=id.toCreature();
        const auto source=::era_bridge::sourceCreatureIdForLevel(creature->getJsonKey());
        // Source145..149 are excluded. Native-only creatures participate in
        // the expanded native roster; native-only machines retain their price.
        if(source?!::era_bridge::creature_prices::affectedSourceCreature(*source)
            :creature->warMachine!=ArtifactID::NONE)return;
        const int32_t previous=gold(&gh.gameInfo(),*creature);
        next["values"][std::to_string(id.getNum())]["6"].Integer()=desired
            ?::era_bridge::creature_prices::half(previous)
            : ::era_bridge::creature_prices::restore(previous);
    });
    next["halfApplied"].Bool()=desired;
    next["revision"].Integer()=static_cast<uint32_t>(next["revision"].Integer()+1);
    EraGameplayChange packet;packet.system="creaturePrices";packet.state=std::move(next);gh.sendAndApply(packet);
}
}
