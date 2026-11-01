/* Native ERA service adapters for VCMI; GPL-2.0-or-later. */
#pragma once
#include "EraBridgeRuntime.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <map>
#include <optional>
#include <string>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct RegenerationPolicy { int hitPoints; int chancePercent; };
// Immutable, versioned native policies. This is not a DLL loader. Unknown
// operations/fields are fatal configuration errors, never ignored commands.
class Policies
{
    std::map<std::string, RegenerationPolicy> regenerationPolicies;
    static int integer(const JsonNode & node, int low, int high)
    {
        if(!node.isNumber() || !std::isfinite(node.Float()) || std::floor(node.Float()) != node.Float() || node.Float() < low || node.Float() > high)
            throw std::runtime_error("ERA bridge: invalid integer policy parameter");
        return static_cast<int>(node.Float());
    }
public:
    Policies()
    {
        const auto resource = JsonPath::builtin("config/era-bridge-runtime");
        if(!CResourceHandler::get()->existsResource(resource))
            return;
        const JsonNode root(resource);
        if(!root.isStruct() || integer(root["schemaVersion"], 1, 1) != 1 || !root["creatures"].isStruct())
            throw std::runtime_error("ERA bridge: invalid runtime policy document");
        for(const auto & field : root.Struct())
            if(field.first != "schemaVersion" && field.first != "creatures")
                throw std::runtime_error("ERA bridge: unsupported root field " + field.first);
        for(const auto & creature : root["creatures"].Struct())
        {
            if(creature.first.find(':') == std::string::npos || !creature.second.isStruct())
                throw std::runtime_error("ERA bridge: policy must use a qualified VCMI creature ID");
            for(const auto & operation : creature.second.Struct())
            {
                if(operation.first != "regeneration" || !operation.second.isStruct())
                    throw std::runtime_error("ERA bridge: unsupported operation " + operation.first);
                for(const auto & field : operation.second.Struct())
                    if(field.first != "hitPoints" && field.first != "chancePercent")
                        throw std::runtime_error("ERA bridge: unsupported regeneration field " + field.first);
                regenerationPolicies.emplace(creature.first, RegenerationPolicy{
                    integer(operation.second["hitPoints"], 0, 1000000000),
                    integer(operation.second["chancePercent"], 0, 100)});
            }
        }
    }
    std::optional<RegenerationPolicy> regeneration(const std::string & creature) const
    {
        const auto found = regenerationPolicies.find(creature);
        if(found == regenerationPolicies.end())
            return std::nullopt;
        return found->second;
    }
    static const Policies & get()
    {
        static const Policies policies;
        return policies;
    }
};
}
VCMI_LIB_NAMESPACE_END
