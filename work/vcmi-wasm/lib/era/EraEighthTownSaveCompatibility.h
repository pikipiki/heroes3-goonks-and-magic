/* Optional strict contract; no format field, building, army or resource change. */
#pragma once
#include "EraEighthTownSaveRule.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <set>
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class EighthTownSaveCompatibility
{
    bool active=false;
public:
    EighthTownSaveCompatibility()
    {
        const auto path=JsonPath::builtin("config/era-bridge-eighth-town-save-compatibility");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2
            || !root["schemaVersion"].isNumber() || root["schemaVersion"].Float()!=1
            || !root["factions"].isVector() || root["factions"].Vector().size()!=9)
            throw std::runtime_error("ERA eighth-town save compatibility: exact nine-faction contract required");
        std::set<std::string> factions;
        for(const auto & entry:root["factions"].Vector())
        {
            if(!entry.isString() || !::era_bridge::originalEighthTownFaction(entry.String())
                || !factions.insert(entry.String()).second)
                throw std::runtime_error("ERA eighth-town save compatibility: original factions only, without duplicates");
        }
        active=true;
    }
    template<typename Row>
    bool restore(std::vector<Row> & rows,const std::string & faction,std::size_t configuredTiers,bool reservesPortal)const
    {
        return active && ::era_bridge::restoreOriginalEighthTownStock(rows,faction,configuredTiers,reservesPortal);
    }
    static const EighthTownSaveCompatibility & get(){static const EighthTownSaveCompatibility policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
