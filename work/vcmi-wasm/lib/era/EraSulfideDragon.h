/* Optional source339 service. No document means inactive; actor remains gated
 * by whole CFG/XP, status-script and native gameplay review outside this file. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class SulfideDragon
{
    bool active=false;
public:
    SulfideDragon()
    {
        const auto file=JsonPath::builtin("config/era-bridge-sulfide-dragon");
        if(!CResourceHandler::get()->existsResource(file))return;
        const JsonNode root(file);
        if(!root.isStruct()||root.Struct().size()!=2||!root["schemaVersion"].isNumber()
            ||root["schemaVersion"].Float()!=1||!root["creature"].isString()
            ||root["creature"].String()!="tum-era:eraCreature339")
            throw std::runtime_error("Original339 exact optional binding required");
        active=true;
    }
    bool enabled(const std::string & key)const{return active&&key=="tum-era:eraCreature339";}
    static const SulfideDragon & get(){static const SulfideDragon value;return value;}
};
}
VCMI_LIB_NAMESPACE_END
