/* Source264/265 are enabled only by a separately reviewed artifact registry. */
#pragma once
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
class StatefulArtifactPolicies
{
    std::map<std::string,int> atma;
public:
    StatefulArtifactPolicies()
    {
        const auto resource=JsonPath::builtin("config/era-stateful-artifact-services");
        if(!CResourceHandler::get()->existsResource(resource))return;
        const JsonNode root(resource);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifacts"].isStruct())
            throw std::runtime_error("Invalid source stateful artifact services");
        for(const auto & entry:root["artifacts"].Struct())
        {
            const int source=entry.first=="tum-era:artifact264"?264:entry.first=="tum-era:artifact265"?265:0;
            if(!source || !entry.second.isStruct() || entry.second.Struct().size()!=1
                || !entry.second["storedEqualization"].isStruct() || !entry.second["storedEqualization"].Struct().empty()
                || !LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact",entry.first,true))
                throw std::runtime_error("Unsupported or unresolved source stateful artifact identity");
            atma.emplace(entry.first,source);
        }
    }
    bool empty() const {return atma.empty();}
    int sourceIdentity(const std::string & id) const
    { const auto found=atma.find(id);return found==atma.end()?0:found->second; }
    static const StatefulArtifactPolicies & get(){static const StatefulArtifactPolicies policies;return policies;}
};
}
VCMI_LIB_NAMESPACE_END
