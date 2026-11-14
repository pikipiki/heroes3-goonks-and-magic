/* Optional exact10-actor dependency gate for six original TUM banks. */
#pragma once
#include "EraBankActorRule.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <set>
#include <stdexcept>
#include <string>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class BankActors
{
    std::set<std::string> actors;
public:
    BankActors()
    {
        const auto file=JsonPath::builtin("config/era-bank-actors");
        if(!CResourceHandler::get()->existsResource(file))return;
        const JsonNode root(file);
        if(!root.isStruct()||root.Struct().size()!=2||!root["schemaVersion"].isNumber()
            ||root["schemaVersion"].Float()!=1||!root["creatures"].isVector()
            ||root["creatures"].Vector().size()!=era_bridge::bankActorSourceIds.size())
            throw std::runtime_error("Bank actors require exact whole10-actor contract");
        for(const auto & value:root["creatures"].Vector())
        {
            if(!value.isString())throw std::runtime_error("Bank actor key must be a string");
            bool accepted=false;
            for(const int id:era_bridge::bankActorSourceIds)
                if(value.String()=="tum-era:eraCreature"+std::to_string(id))accepted=true;
            if(!accepted||!actors.insert(value.String()).second)
                throw std::runtime_error("Invalid or duplicate original bank actor");
        }
    }
    int sourceId(const std::string & key)const
    {
        if(!owns(key))return -1;
        for(const int id:era_bridge::bankActorSourceIds)
            if(key=="tum-era:eraCreature"+std::to_string(id))return id;
        return -1;
    }
    bool owns(const std::string & key)const{return actors.count(key)!=0;}
    bool enabled()const{return !actors.empty();}
    static const BankActors & get(){static const BankActors instance;return instance;}
};
}
VCMI_LIB_NAMESPACE_END
