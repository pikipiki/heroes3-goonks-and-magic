/* Named TUM180/220 services. Independent from the reviewed phase3 registry. */
#pragma once
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include <set>
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class AdvancedArtifactPolicies
{
    std::set<std::string> diplomacy;
    std::set<std::string> lightning;
public:
    AdvancedArtifactPolicies()
    {
        const auto resource=JsonPath::builtin("config/era-advanced-artifact-services");
        if(!CResourceHandler::get()->existsResource(resource))return;
        const JsonNode root(resource);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifacts"].isStruct())
            throw std::runtime_error("Invalid source advanced artifact services");
        for(const auto & entry:root["artifacts"].Struct())
        {
            if(!entry.second.isStruct() || entry.second.Struct().size()!=1
                || !LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact",entry.first,true))
                throw std::runtime_error("Unresolved source advanced artifact");
            if(entry.first=="tum-era:artifact180")
            {
                const auto & service=entry.second["perceivedStrength"];
                if(!service.isStruct() || service.Struct().size()!=1 || !service["multiplier"].isNumber()
                    || service["multiplier"].Float()!=3)
                    throw std::runtime_error("Source180 requires perceived multiplier3");
                diplomacy.insert(entry.first);
            }
            else if(entry.first=="tum-era:artifact220")
            {
                if(!entry.second["lightningRod"].isStruct() || !entry.second["lightningRod"].Struct().empty())
                    throw std::runtime_error("Source220 requires exact named LightningRod service");
                lightning.insert(entry.first);
            }
            else throw std::runtime_error("Unsupported source advanced artifact identity");
        }
    }
    bool perceivedStrength(const std::string & id) const {return diplomacy.count(id)!=0;}
    bool lightningRod(const std::string & id) const {return lightning.count(id)!=0;}
    static const AdvancedArtifactPolicies & get(){static const AdvancedArtifactPolicies policies;return policies;}
};
}
VCMI_LIB_NAMESPACE_END
