#pragma once
#include "EraSourceCreatureSpellPower.h"
#include "EraSourceSpellAccuracy.h"
#include "../battle/Unit.h"
#include "../CCreatureHandler.h"
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
                // XP71DB38 passes intermediate power3; Amethyst5A0145
                // replaces it from CURRENT active creature except62/70..80.
                if(!spell.isString() || (spell.String()!="core:sorrow" && spell.String()!="core:blind" && spell.String()!="core:berserk" && spell.String()!="core:titanBolt" && spell.String()!="core:destroyUndead" && spell.String()!="core:deathRipple" && spell.String()!="core:cure" && spell.String()!="core:fireball"))
                    throw std::runtime_error("ERA experience attack spells: unproven spell contract");
                if(spell.String()=="core:fireball" && entry.first!="tum-era:eraCreature294")
                    throw std::runtime_error("ERA experience attack spells: exact source294 area contract required");
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
        if(mode == BonusType::SPELL_BEFORE_ATTACK && (spell == "core:sorrow" || spell == "core:titanBolt" || spell == "core:destroyUndead" || spell == "core:deathRipple" || spell == "core:cure")) return 3;
        if(mode == BonusType::SPELL_AFTER_ATTACK && spell == "core:blind") return 3;
        if(mode == BonusType::SPELL_AFTER_ATTACK && spell == "core:berserk") return 2;
        if(mode == BonusType::SPELL_AFTER_ATTACK && creature=="tum-era:eraCreature294" && spell=="core:fireball")return 3;
        return -1;
    }
    static const ExperienceAttackSpells & get()
    {
        static const ExperienceAttackSpells instance;
        return instance;
    }
};
// Only the source71D939 XP path invokes this helper. Intrinsic kind2 casts
// retain their own power. A retaliation does not replace the primary active
// manager stack read by the original5A0145 hook.
inline int experienceAttackPower(const battle::Unit * active,int spell)
{
    if(!active || !::era_bridge::SourceCreatureSpellPower::overrides(1,spell))return 3;
    const auto & key=active->creatureId().toCreature()->getJsonKey();
    const int sourceId=StatusAttacks::get().id(key);
    int power=active->getCount();
    if(active->unitSlot()==SlotID::COMMANDER_SLOT_PLACEHOLDER)
    {
        // Native commander CREATURE_SPELL_POWER carries the existing bridge's
        // raw magic stat (base1 + source skill curve1/3/6/14/29). Source76BEEA
        // uses its quarter, rounded up, except original Soul Eater178/187.
        const int raw=active->valOfBonuses(BonusType::CREATURE_SPELL_POWER)/100;
        power=::era_bridge::SourceCreatureSpellPower::commander(raw,
            key=="wake-of-gods.commanders:soulEater1");
    }
    return ::era_bridge::SourceCreatureSpellPower::forSource(sourceId).apply(static_cast<std::uint32_t>(power));
}
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
