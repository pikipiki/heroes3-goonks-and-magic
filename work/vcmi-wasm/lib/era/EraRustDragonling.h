/* Whole source344: queued acid defence selector8 only. GPL-2.0-or-later. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <stdexcept>
#include <string>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class RustDragonling
{
    bool active=false;
public:
    RustDragonling()
    {
        const auto path=JsonPath::builtin("config/era-bridge-rust-dragonling");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2
            || !root["schemaVersion"].isNumber() || root["schemaVersion"].Float()!=1
            || !root["creature"].isString() || root["creature"].String()!="tum-era:eraCreature344")
            throw std::runtime_error("ERA rust dragonling: exact source344 contract required");
        active=true;
    }
    bool enabled(const std::string & key)const{return active && key=="tum-era:eraCreature344";}
    static const RustDragonling & get(){static const RustDragonling policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
