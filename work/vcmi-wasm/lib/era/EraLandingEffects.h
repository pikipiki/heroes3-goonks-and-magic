/* Native playback of source HitEffects.Melee/Shot assignments. GPL-2.0-or-later. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <map>
#include <optional>
#include <string>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct LandingEffect { std::string animation; std::string sound; };
class LandingEffects
{
    std::map<std::string, LandingEffect> melee;
    std::map<std::string, LandingEffect> ranged;
public:
    LandingEffects()
    {
        const auto path=JsonPath::builtin("config/era-bridge-landing-effects");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isStruct())
            throw std::runtime_error("ERA landing effects: invalid document");
        for(const auto & item:root["creatures"].Struct())
        {
            if(item.first.find(':')==std::string::npos || !item.second.isStruct()
                || item.second.Struct().empty() || item.second.Struct().size()>2)
                throw std::runtime_error("ERA landing effects: invalid creature");
            for(const auto & entry:item.second.Struct())
            {
                if(entry.first!="melee" && entry.first!="ranged")
                    throw std::runtime_error("ERA landing effects: unknown attack context");
                const auto & node=entry.second;
                if(!node.isStruct() || !node["animation"].isString()
                    || node.Struct().size()!=(node["sound"].isNull()?1:2)
                    || (!node["sound"].isNull() && !node["sound"].isString()))
                    throw std::runtime_error("ERA landing effects: invalid attack fields");
                LandingEffect rule{node["animation"].String(),node["sound"].isNull()?"":node["sound"].String()};
                const auto safe=[](const std::string & value)
                {return value.find("tum-era/hit-effects/")==0 && value.find("..") == std::string::npos;};
                if(!safe(rule.animation) || (!rule.sound.empty() && !safe(rule.sound)))
                    throw std::runtime_error("ERA landing effects: asset outside verified namespace");
                (entry.first=="melee"?melee:ranged).emplace(item.first,std::move(rule));
            }
        }
    }
    const LandingEffect * findMelee(const std::string & creature) const
    {
        const auto found=melee.find(creature);
        return found==melee.end()?nullptr:&found->second;
    }
    const LandingEffect * findRanged(const std::string & creature) const
    {
        const auto found=ranged.find(creature);
        return found==ranged.end()?nullptr:&found->second;
    }
    static const LandingEffects & get(){static const LandingEffects instance;return instance;}
};
}
VCMI_LIB_NAMESPACE_END
