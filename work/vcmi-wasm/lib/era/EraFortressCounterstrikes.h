/* Original441AFF/441B62, source353/354 only. No forced life/status/counter gates.
 * Independently reconstructed source contracts; GPL-2.0-or-later. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class FortressCounterstrikes
{
    bool active=false;
public:
    FortressCounterstrikes()
    {
        const auto path=JsonPath::builtin("config/era-bridge-fortress-counterstrikes");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isVector()
            || root["creatures"].Vector().size()!=2
            || !root["creatures"].Vector()[0].isString() || !root["creatures"].Vector()[1].isString()
            || root["creatures"].Vector()[0].String()!="tum-era:eraCreature353"
            || root["creatures"].Vector()[1].String()!="tum-era:eraCreature354")
            throw std::runtime_error("ERA Fortress: whole source353/354 contract required");
        active=true;
    }
    bool fury(const std::string & key)const
    {return active && (key=="tum-era:eraCreature353" || key=="tum-era:eraCreature354");}
    bool twice(const std::string & key)const{return active && key=="tum-era:eraCreature354";}
    static const FortressCounterstrikes & get(){static const FortressCounterstrikes policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
