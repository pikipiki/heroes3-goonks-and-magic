/* Original134 kind1 targeting and resistance; independent opt-in from258/356. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class OriginalFaerie
{
    bool active=false;
public:
    OriginalFaerie()
    {
        const auto path=JsonPath::builtin("config/era-bridge-original-faerie");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2
            || !root["schemaVersion"].isNumber() || root["schemaVersion"].Float()!=1
            || !root["creature"].isString() || root["creature"].String()!="core:fairieDragon")
            throw std::runtime_error("ERA original faerie: exact source134 contract required");
        active=true;
    }
    bool enabled(const std::string & key)const{return active && key=="core:fairieDragon";}
    static const OriginalFaerie & get(){static const OriginalFaerie policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
