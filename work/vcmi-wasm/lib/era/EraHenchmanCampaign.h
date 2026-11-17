#pragma once
#include "../json/JsonNode.h"

namespace era_compat::henchmen
{
inline void prepareCampaignTransfer(JsonNode & hero,bool transfer,bool freeBanner)
{
    if(!transfer){hero.Struct().erase("henchman");return;}
    if(!hero["henchman"].isStruct())return;
    // OnTransferHero carries w117/w118/w119, not the named stack-XP cell.
    // ERA resets associative memory at a new map's ERM initialization. The
    // dedicated banner INI is the source's only extra carryover here.
    hero["henchman"]["stackExperience"].Integer()=0;
    if(!freeBanner)hero["henchman"]["banner"].Integer()=-1;
}
}
