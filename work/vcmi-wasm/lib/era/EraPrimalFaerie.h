/* Whole source258 contract; no fallback for an absent optional provider. */
#pragma once
#include "EraSourceCreatureSpellPower.h"
#include "EraPrimalFaerieRule.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class PrimalFaerie
{
    bool active=false;
public:
    PrimalFaerie()
    {
        const auto path=JsonPath::builtin("config/era-bridge-primal-faerie");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isVector()
            || root["creatures"].Vector().size()!=1 || !root["creatures"].Vector()[0].isString()
            || root["creatures"].Vector()[0].String()!="tum-era:eraCreature258")
            throw std::runtime_error("ERA primal faerie: whole source258 contract required");
        active=true;
    }
    bool enabled(const std::string & key)const{return active && key=="tum-era:eraCreature258";}
    static const PrimalFaerie & get(){static const PrimalFaerie policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
