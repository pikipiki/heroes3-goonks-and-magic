/* Strict optional Fangarm263/Horn266 binding; GPL-2.0-or-later. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../battle/Unit.h"
#include "../bonuses/BonusParameters.h"
#include "../bonuses/BonusSelector.h"
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class Horn266Policy
{
    bool active=false;
public:
    Horn266Policy()
    {
        const auto path=JsonPath::builtin("config/era-horn266-contract");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=4 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifact"].isString()
            || root["artifact"].String()!="tum-era:artifact266" || !root["creature"].isString()
            || root["creature"].String()!="tum-era:eraCreature263" || !root["contract"].isString()
            || root["contract"].String()!="source-fangarm263-hypnotize-v1")
            throw std::runtime_error("Whole source266/263 native contract required");
        active=true;
    }
    static bool enabled(){static const Horn266Policy policy;return policy.active;}
};
inline bool sourceHorn266ZeroBase(const battle::Unit & unit)
{
    if(!Horn266Policy::enabled())return false;
    const auto markers=unit.getBonusBearer()->getBonuses(Selector::type()(BonusType::ERA_ARTIFACT_SUMMON));
    for(const auto & marker:*markers)
    {
        if(marker->source!=BonusSource::ARTIFACT || !marker->parameters)continue;
        try
        {
            const auto & p=marker->parameters->toVector();
            if(p.size()==3 && p[0]==1 && p[1]==266 && p[2]==0)return true;
        }
        catch(const std::runtime_error &){continue;}
    }
    return false;
}
}
VCMI_LIB_NAMESPACE_END
