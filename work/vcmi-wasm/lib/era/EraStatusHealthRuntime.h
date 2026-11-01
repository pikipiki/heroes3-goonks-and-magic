#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
// Opt-in module policy. Source444C3E/444CDE is global in the installed ERA
// engine, including Blood/RedBones Age when no254 participates in the battle.
inline bool sourceHealthBattleEnabled()
{
    static const bool enabled=[]()
    {
        const auto path=JsonPath::builtin("config/era-bridge-status-health");
        if(!CResourceHandler::get()->existsResource(path))return false;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["enabled"].isBool())
            throw std::runtime_error("ERA status health: invalid module policy");
        return root["enabled"].Bool();
    }();
    return enabled;
}
}
VCMI_LIB_NAMESPACE_END
