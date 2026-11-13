/* Original43 post-effect mana channel; independent, explicit opt-in. */
#pragma once
#include "EraConfluxPolicies.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class FamiliarChannel43
{
    bool active=false;
public:
    FamiliarChannel43()
    {
        const auto path=JsonPath::builtin("config/era-core-familiar-channel43");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2
            || !root["schemaVersion"].isNumber() || root["schemaVersion"].Float()!=1
            || !root["creature"].isString() || root["creature"].String()!="core:familiar")
            throw std::runtime_error("ERA Familiar channel: exact source43 contract required");
        active=true;
    }
    bool enabled(const std::string & key)const{return active && key=="core:familiar";}
    static const FamiliarChannel43 & get(){static const FamiliarChannel43 policy;return policy;}
};
inline bool sourcePostEffectManaChannel(const std::string & key)
{
    return ConfluxPolicies::get().is356(key) || FamiliarChannel43::get().enabled(key);
}
}
VCMI_LIB_NAMESPACE_END
