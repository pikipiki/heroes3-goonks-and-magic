/* Native TUM artifact daily-conversion adapter; GPL-2.0-or-later. */
#pragma once
#include "EraBridgeArtifactRuntime.h"
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include <map>
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class ArtifactPolicies
{
    std::map<std::string, std::vector<::era_bridge::DailyConversion>> conversions;
    static int creature(const JsonNode & node)
    {
        if(!node.isString() || node.String().find(':') == std::string::npos)
            throw std::runtime_error("ERA artifact conversion requires qualified creature IDs");
        const auto id = LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(), "creature", node.String(), true);
        if(!id || *id < 0)
            throw std::runtime_error("ERA artifact conversion has unresolved creature " + node.String());
        return *id;
    }
public:
    ArtifactPolicies()
    {
        const auto resource = JsonPath::builtin("config/era-bridge-runtime");
        if(!CResourceHandler::get()->existsResource(resource))
            return;
        const JsonNode root(resource);
        if(!root.isStruct() || !root["schemaVersion"].isNumber() || root["schemaVersion"].Float() != 1
            || !root["creatures"].isStruct())
            throw std::runtime_error("ERA bridge: invalid runtime policy document");
        for(const auto & field : root.Struct())
            if(field.first != "schemaVersion" && field.first != "creatures" && field.first != "artifacts")
                throw std::runtime_error("ERA bridge: unsupported root field " + field.first);
        const auto & artifacts = root["artifacts"];
        if(artifacts.isNull())
            return;
        if(!artifacts.isStruct())
            throw std::runtime_error("ERA bridge artifacts must be an object");
        for(const auto & entry : artifacts.Struct())
        {
            if(entry.first.find(':') == std::string::npos || !entry.second.isStruct()
                || entry.second.Struct().size() != 1 || !entry.second["dailyConversions"].isVector())
                throw std::runtime_error("ERA artifact supports only dailyConversions with a qualified artifact ID");
            // Resolve artifact too. A typo must fail at startup rather than silently disable gameplay.
            if(!LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(), "artifact", entry.first, true))
                throw std::runtime_error("ERA artifact conversion has unresolved artifact " + entry.first);
            const auto & pairs = entry.second["dailyConversions"].Vector();
            if(pairs.empty() || pairs.size() > 9)
                throw std::runtime_error("ERA artifact must have 1..9 ordered conversion pairs");
            auto & out = conversions[entry.first];
            for(const auto & pair : pairs)
            {
                if(!pair.isStruct() || pair.Struct().size() != 2 || pair["from"].isNull() || pair["to"].isNull())
                    throw std::runtime_error("ERA artifact conversion requires exactly from and to");
                out.push_back({creature(pair["from"]), creature(pair["to"])});
            }
        }
    }
    const std::vector<::era_bridge::DailyConversion> * dailyConversions(const std::string & artifact) const
    {
        const auto found = conversions.find(artifact);
        return found == conversions.end() ? nullptr : &found->second;
    }
    static const ArtifactPolicies & get()
    {
        static const ArtifactPolicies policies;
        return policies;
    }
};
}
VCMI_LIB_NAMESPACE_END
