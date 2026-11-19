#pragma once
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"
#include "EraCampaignHints.h"
#include "EraTileNumberRules.h"
#include <stdexcept>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat::tile_properties
{
inline void validate(const JsonNode & saved)
{
    const auto & numbers=saved["numbers"];
    if(!saved.isStruct()||(!numbers.isNull()&&!numbers.isStruct()))
        throw std::runtime_error("Invalid source tile properties");
    if(numbers.isStruct())for(const auto & entry:numbers.Struct())
        if(!entry.second.isNumber()||entry.second.Integer()<0||entry.second.Integer()>15
            ||entry.second.Float()!=entry.second.Integer())
            throw std::runtime_error("Invalid source tile number");
}
inline const JsonNode & state(const CGameState & game)
{
    return game.getMap().eraGameplayState["tileProperties"];
}
inline int number(const CGameState & game,const int3 & position)
{
    const auto & saved=state(game)["numbers"][era_campaign_hints::positionKey(position)];
    if(saved.isNull())return 0;
    if(!saved.isNumber()||saved.Integer()<0||saved.Integer()>15)
        throw std::runtime_error("Invalid source tile number");
    return static_cast<int>(saved.Integer());
}
inline void setNumber(JsonNode & saved,const int3 & position,std::int32_t value)
{
    const auto key=era_campaign_hints::positionKey(position);
    const auto encoded=era_bridge::tile_properties::number(value);
    if(encoded)saved["numbers"][key].Integer()=encoded;
    else saved["numbers"].Struct().erase(key);
}
}
VCMI_LIB_NAMESPACE_END
