#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../constants/EntityIdentifiers.h"
#include "../spells/AbilityCaster.h"
#include "../bonuses/Bonus.h"
#include <map>
#include <set>
#include <string>

VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class ExperienceAttackSpells
{
    std::map<std::string,std::set<std::string>> creatures;
public:
    ExperienceAttackSpells()
    {
        const auto path = JsonPath::builtin("config/era-bridge-experience-attack-spells");
        if(!CResourceHandler::get()->existsResource(path))
            return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isStruct())
            throw std::runtime_error("ERA experience attack spells: invalid document");
        for(const auto & entry : root["creatures"].Struct())
        {
            if(entry.first.find(':')==std::string::npos || !entry.second.isVector() || entry.second.Vector().empty())
                throw std::runtime_error("ERA experience attack spells: explicit qualified creature and spells required");
            for(const auto & spell : entry.second.Vector())
            {
                // Source-proven p#50 expert mass Sorrow with power/duration3.
                if(!spell.isString() || (spell.String()!="core:sorrow" && spell.String()!="core:blind" && spell.String()!="core:berserk" && spell.String()!="core:titanBolt"))
                    throw std::runtime_error("ERA experience attack spells: unproven spell contract");
                if(!creatures[entry.first].insert(spell.String()).second)
                    throw std::runtime_error("ERA experience attack spells: duplicate spell");
            }
        }
    }
    bool enabled(const std::string & creature, const std::string & spell) const
    {
        const auto found=creatures.find(creature);
        return found!=creatures.end() && found->second.count(spell)!=0;
    }
    int mastery(const std::string & creature, const std::string & spell, BonusType mode) const
    {
        if(!enabled(creature, spell)) return -1;
        if(mode == BonusType::SPELL_BEFORE_ATTACK && (spell == "core:sorrow" || spell == "core:titanBolt")) return 3;
        if(mode == BonusType::SPELL_AFTER_ATTACK && spell == "core:blind") return 3;
        if(mode == BonusType::SPELL_AFTER_ATTACK && spell == "core:berserk") return 2;
        return -1;
    }
    static const ExperienceAttackSpells & get()
    {
        static const ExperienceAttackSpells instance;
        return instance;
    }
};
class ExperienceAttackCaster final : public spells::AbilityCaster
{
    PlayerColor effectiveOwner;
public:
    ExperienceAttackCaster(const battle::Unit * unit, PlayerColor owner, int mastery = 3)
        : spells::AbilityCaster(unit,mastery), effectiveOwner(owner) {}
    PlayerColor getCasterOwner() const override { return effectiveOwner; }
};
}
VCMI_LIB_NAMESPACE_END
