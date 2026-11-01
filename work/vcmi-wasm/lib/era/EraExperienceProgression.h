#pragma once
#include "EraExperience.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include <map>
#include <string>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class ExperienceProgressions
{
    std::map<std::string, ::era_bridge::ExperienceProgression> creatures;
    static uint32_t integer(const JsonNode & value, uint32_t maximum)
    {
        if(!value.isNumber() || !std::isfinite(value.Float()) || value.Float() < 0
            || value.Float() > maximum || std::floor(value.Float()) != value.Float())
            throw std::runtime_error("ERA experience: invalid integer");
        return static_cast<uint32_t>(value.Float());
    }
public:
    ExperienceProgressions()
    {
        const auto path = JsonPath::builtin("config/era-bridge-experience");
        if(!CResourceHandler::get()->existsResource(path))
            return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size() != 2 || integer(root["schemaVersion"], 1) != 1 || !root["creatures"].isStruct())
            throw std::runtime_error("ERA experience: invalid document");
        for(const auto & creature : root["creatures"].Struct())
        {
            if(creature.first.find(':') == std::string::npos || !creature.second.isStruct())
                throw std::runtime_error("ERA experience: qualified creature ID required");
            const auto & row = creature.second;
            if(row.Struct().size() != 5)
                throw std::runtime_error("ERA experience: five complete parameters required");
            for(const auto & field : row.Struct())
                if(field.first != "fullRank10" && field.first != "rank11Extra" && field.first != "battlePercent"
                    && field.first != "experienceMultiplier" && field.first != "upgradeMultiplier")
                    throw std::runtime_error("ERA experience: unknown parameter " + field.first);
            const auto full = integer(row["fullRank10"], 1000000000);
            const auto extra = integer(row["rank11Extra"], 1000000000);
            const auto percent = integer(row["battlePercent"], 100);
            // CREXPMOD stores these as float32; VCMI's decimal parser may
            // produce a double oneULP away from the correctly-rounded value.
            const float gain = row["experienceMultiplier"].isNumber()
                ? static_cast<float>(row["experienceMultiplier"].Float()) : 0.0f;
            const float upgrade = row["upgradeMultiplier"].isNumber()
                ? static_cast<float>(row["upgradeMultiplier"].Float()) : 0.0f;
            if(!full || !percent || (gain != 1.0f && gain != 0.5f) || upgrade != 0.75f)
                throw std::runtime_error("ERA experience: unsupported multiplier or zero progression");
            creatures.emplace(creature.first, ::era_bridge::ExperienceProgression{full, extra, percent, gain, upgrade});
        }
    }
    const ::era_bridge::ExperienceProgression * find(const std::string & creature) const
    {
        const auto found = creatures.find(creature);
        return found == creatures.end() ? nullptr : &found->second;
    }
    static const ExperienceProgressions & get()
    {
        static const ExperienceProgressions instance;
        return instance;
    }
};
}
VCMI_LIB_NAMESPACE_END
