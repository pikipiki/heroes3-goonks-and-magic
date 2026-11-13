/* Optional whole346/347 bindings; missing document is inactive. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <set>
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class PrimordialPolicies
{
    std::set<std::string> actors;
public:
    PrimordialPolicies()
    {
        const auto path=JsonPath::builtin("config/era-bridge-primordial");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct()||root.Struct().size()!=2||!root["schemaVersion"].isNumber()
            ||root["schemaVersion"].Float()!=1||!root["creatures"].isVector())
            throw std::runtime_error("Original346/347 optional document required");
        for(const auto & value:root["creatures"].Vector())
            if(!value.isString()||(value.String()!="tum-era:eraCreature346"&&value.String()!="tum-era:eraCreature347")
                ||!actors.insert(value.String()).second)
                throw std::runtime_error("Original346/347 exact unique creature bindings required");
    }
    bool owns(const std::string & key)const{return actors.count(key)!=0;}
    bool is347(const std::string & key)const{return owns(key)&&key=="tum-era:eraCreature347";}
    static const PrimordialPolicies & get(){static const PrimordialPolicies instance;return instance;}
};
}
VCMI_LIB_NAMESPACE_END
