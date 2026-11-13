/* Whole source343: pool/aimed caster, current-count+1 power. GPL-2.0-or-later. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class DragonlingFaerie
{
    bool active=false;
public:
    DragonlingFaerie()
    {
        const auto path=JsonPath::builtin("config/era-bridge-faerie-dragonling");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2
            || !root["schemaVersion"].isNumber() || root["schemaVersion"].Float()!=1
            || !root["creature"].isString() || root["creature"].String()!="tum-era:eraCreature343")
            throw std::runtime_error("ERA faerie dragonling: exact source343 contract required");
        active=true;
    }
    bool enabled(const std::string & key)const{return active && key=="tum-era:eraCreature343";}
    static const DragonlingFaerie & get(){static const DragonlingFaerie policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
