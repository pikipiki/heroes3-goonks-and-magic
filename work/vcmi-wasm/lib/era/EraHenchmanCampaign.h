#pragma once
#include "../json/JsonNode.h"

namespace era_compat::henchmen
{
inline void prepareCampaignTransfer(JsonNode & hero,bool oldTransfer,bool oldFreeBanner)
{
    if(!hero["henchman"].isStruct())return;
    // OnTransferHero carries w117/w118/w119, not the named stack-XP cell.
    // ERA resets associative memory at a new map's ERM initialization. The
    // dedicated banner INI is the source's only extra carryover here. Preserve
    // the hero fields even if transfer was disabled on the departing map:
    // OnTransferHero tests the arriving map's newly loaded configuration.
    hero["henchman"]["stackExperience"].Integer()=0;
    if(!oldTransfer||!oldFreeBanner||hero["henchman"]["banner"].Integer()<=0)
        hero["henchman"]["banner"].Integer()=-1;
}
}
