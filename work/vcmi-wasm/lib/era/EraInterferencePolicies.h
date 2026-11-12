/* A closed named registry: source26910%,27010%,27125%, no arbitrary nerfs. */
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
class InterferencePolicies
{
    std::map<std::string,int> sources;
public:
    InterferencePolicies()
    {
        const auto resource=JsonPath::builtin("config/era-interference-artifact-services");
        if(!CResourceHandler::get()->existsResource(resource))return;
        const JsonNode root(resource);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifacts"].isStruct())
            throw std::runtime_error("Invalid source Interference artifact services");
        for(const auto & entry:root["artifacts"].Struct())
        {
            const int source=entry.first=="tum-era:artifact269"?269:entry.first=="tum-era:artifact270"?270:entry.first=="tum-era:artifact271"?271:0;
            if(!source || !entry.second.isStruct() || entry.second.Struct().size()!=1)
                throw std::runtime_error("Unsupported source Interference artifact identity");
            const auto & service=entry.second["interference"];
            if(!service.isStruct() || service.Struct().size()!=1 || !service["percent"].isNumber()
                || service["percent"].Float()!=(source==271?25:10)
                || !LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact",entry.first,true))
                throw std::runtime_error("Unresolved or changed source Interference artifact contract");
            sources.emplace(entry.first,source);
        }
    }
    int sourceIdentity(const std::string & key) const
    {const auto found=sources.find(key);return found==sources.end()?0:found->second;}
    static const InterferencePolicies & get(){static const InterferencePolicies policies;return policies;}
};
}
VCMI_LIB_NAMESPACE_END
