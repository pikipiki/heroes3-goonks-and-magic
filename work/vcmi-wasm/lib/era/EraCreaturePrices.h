/* Map-local recruitment prices. Shared creature definitions remain immutable. */
#pragma once
#include "../CCreatureHandler.h"
#include "../ResourceSet.h"
#include "../callback/IGameInfoCallback.h"
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"
#include "../json/JsonNode.h"
#include <cstdint>
#include <limits>
#include <stdexcept>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat::creature_prices
{
inline const JsonNode & state(const IGameInfoCallback & cb)
{
    return cb.gameState().getMap().eraGameplayState["creaturePrices"];
}
inline int32_t word(const JsonNode & value)
{
    if(!value.isNumber()||value.Float()<std::numeric_limits<int32_t>::min()
        ||value.Float()>std::numeric_limits<int32_t>::max()
        ||value.Float()!=static_cast<double>(value.Integer()))
        throw std::runtime_error("Invalid original creature price word");
    return static_cast<int32_t>(value.Integer());
}
inline void validate(const JsonNode & value)
{
    if(!value.isStruct()||value["version"].Integer()!=1
        ||!value["halfApplied"].isBool()||!value["values"].isStruct())
        throw std::runtime_error("Invalid original creature price state");
    for(const auto & [id,row]:value["values"].Struct())
    {
        if(id.empty()||id.size()>5||id.find_first_not_of("0123456789")!=std::string::npos
            ||std::stoi(id)>65535||std::to_string(std::stoi(id))!=id||!row.isStruct())
            throw std::runtime_error("Invalid original creature price identity");
        for(const auto & [resource,amount]:row.Struct())
        {
            if(resource.size()!=1||resource[0]<'0'||resource[0]>'6')
                throw std::runtime_error("Invalid original creature price resource");
            word(amount);
        }
    }
}
inline ResourceSet get(const IGameInfoCallback * cb,const Creature & creature)
{
    auto result=creature.getFullRecruitCost();
    if(!cb)return result;
    const auto & row=state(*cb)["values"][std::to_string(creature.getIndex())];
    for(int resource=0;resource<7;++resource)
    {
        const auto & saved=row[std::to_string(resource)];
        if(!saved.isNull())result[GameResID(resource)]=word(saved);
    }
    return result;
}
inline ResourceSet get(const IGameInfoCallback & cb,const Creature & creature)
{
    return get(&cb,creature);
}
inline int32_t gold(const IGameInfoCallback * cb,const Creature & creature)
{
    return get(cb,creature)[GameResID::GOLD];
}
inline int32_t maxAmount(const IGameInfoCallback * cb,const Creature & creature,const ResourceSet & funds)
{
    const auto quote=get(cb,creature);
    // Retain the native free-creature bound; use wide division to avoid UB on
    // a signed minimum balance paired with a negative cost from external data.
    int64_t result=2147483645;
    for(size_t resource=0;resource<std::min(funds.size(),quote.size());++resource)
        if(quote[resource])result=std::min(result,static_cast<int64_t>(funds[resource])/quote[resource]);
    return static_cast<int32_t>(result);
}
}
VCMI_LIB_NAMESPACE_END
