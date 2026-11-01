#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <set>
#include <string>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class PhysicalAbilities
{
    std::set<std::string> spells;
public:
    PhysicalAbilities()
    {
        const auto path=JsonPath::builtin("config/era-bridge-physical-abilities");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["spells"].isVector() || root["spells"].Vector().empty())
            throw std::runtime_error("ERA physical abilities: invalid document");
        for(const auto & spell : root["spells"].Vector())
            if(!spell.isString() || spell.String()!="tum-era:skeletalTransformation" || !spells.insert(spell.String()).second)
                throw std::runtime_error("ERA physical abilities: unproven or duplicate ability");
    }
    bool enabled(const std::string & spell) const { return spells.count(spell)!=0; }
    static const PhysicalAbilities & get()
    {
        static const PhysicalAbilities instance;
        return instance;
    }
};
}
VCMI_LIB_NAMESPACE_END
