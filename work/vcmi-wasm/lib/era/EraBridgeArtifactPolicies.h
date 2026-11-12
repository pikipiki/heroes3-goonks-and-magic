/* Native TUM artifact daily-conversion adapter; GPL-2.0-or-later. */
#pragma once
#include "EraBridgeArtifactRuntime.h"
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include <map>
#include <stdexcept>
#include <string>
#include <set>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class ArtifactPolicies
{
    std::map<std::string, std::vector<::era_bridge::DailyConversion>> conversions;
    std::map<std::string, std::vector<::era_bridge::OpeningSummon>> summons;
    std::set<std::string> exchangeCloaks;
    std::set<std::pair<std::string,int>> massSpells;
    std::map<std::string,bool> goldenGeese;
    std::set<std::string> reflections;
    std::set<std::string> elementalRings;
    static int creature(const JsonNode & node)
    {
        if(!node.isString() || node.String().find(':') == std::string::npos)
            throw std::runtime_error("ERA artifact conversion requires qualified creature IDs");
        const auto id = LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(), "creature", node.String(), true);
        if(!id || *id < 0)
            throw std::runtime_error("ERA artifact conversion has unresolved creature " + node.String());
        return *id;
    }
public:
    ArtifactPolicies()
    {
        const auto resource = JsonPath::builtin("config/era-bridge-runtime");
        if(!CResourceHandler::get()->existsResource(resource))
            return;
        const JsonNode root(resource);
        if(!root.isStruct() || !root["schemaVersion"].isNumber() || root["schemaVersion"].Float() != 1
            || !root["creatures"].isStruct())
            throw std::runtime_error("ERA bridge: invalid runtime policy document");
        for(const auto & field : root.Struct())
            if(field.first != "schemaVersion" && field.first != "creatures" && field.first != "artifacts")
                throw std::runtime_error("ERA bridge: unsupported root field " + field.first);
        const auto & artifacts = root["artifacts"];
        if(artifacts.isNull())
            return;
        if(!artifacts.isStruct())
            throw std::runtime_error("ERA bridge artifacts must be an object");
        for(const auto & entry : artifacts.Struct())
        {
            if(entry.first.find(':') == std::string::npos || !entry.second.isStruct() || entry.second.Struct().empty())
                throw std::runtime_error("ERA artifact requires a qualified artifact ID and services");
            for(const auto & operation:entry.second.Struct())
                if(operation.first!="dailyConversions" && operation.first!="openingSummons" && operation.first!="exchangeCloak" && operation.first!="massSpells" && operation.first!="goldenGoose" && operation.first!="reflection" && operation.first!="elementalFreedom")
                    throw std::runtime_error("ERA artifact has unsupported service "+operation.first);
            // Resolve artifact too. A typo must fail at startup rather than silently disable gameplay.
            if(!LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(), "artifact", entry.first, true))
                throw std::runtime_error("ERA artifact conversion has unresolved artifact " + entry.first);
            const auto & goose=entry.second["goldenGoose"];
            if(!goose.isNull())
            {
                if(entry.first!="tum-era:artifact179" || !goose.isStruct() || goose.Struct().size()!=1
                    || !goose["countBackpack"].isBool())
                    throw std::runtime_error("ERA Golden Goose requires original179 and source backpack switch");
                goldenGeese.emplace(entry.first,goose["countBackpack"].Bool());
            }
            const auto & reflection=entry.second["reflection"];
            if(!reflection.isNull())
            {
                if(entry.first!="tum-era:artifact181" || !reflection.isStruct() || reflection.Struct().size()!=1
                    || !reflection["resistanceBonus"].isNumber() || reflection["resistanceBonus"].Float()!=20)
                    throw std::runtime_error("ERA Reflection requires original181 and exact20percent addition");
                reflections.insert(entry.first);
            }
            const auto & elemental=entry.second["elementalFreedom"];
            if(!elemental.isNull())
            {
                if(entry.first!="tum-era:artifact197" || !elemental.isStruct() || !elemental.Struct().empty())
                    throw std::runtime_error("ERA elemental freedom requires original197 and empty service");
                elementalRings.insert(entry.first);
            }
            if(!entry.second["exchangeCloak"].isNull())
            {
                if(entry.first!="tum-era:artifact261" || !entry.second["exchangeCloak"].isStruct()
                    || !entry.second["exchangeCloak"].Struct().empty())
                    throw std::runtime_error("ERA Exchange Cloak requires original artifact261 and empty service");
                exchangeCloaks.insert(entry.first);
            }
            const auto & mass=entry.second["massSpells"];
            if(!mass.isNull())
            {
                const std::vector<std::string> expected=entry.first=="tum-era:artifact262"
                    ? std::vector<std::string>{"core:resurrection","core:animateDead"}
                    : entry.first=="tum-era:artifact263" ? std::vector<std::string>{"core:implosion"} : std::vector<std::string>{};
                if(expected.empty() || !mass.isStruct() || mass.Struct().size()!=2
                    || !mass["powerPercent"].isNumber() || mass["powerPercent"].Float()!=30
                    || !mass["spells"].isVector() || mass["spells"].Vector().size()!=expected.size())
                    throw std::runtime_error("ERA mass spell requires original262/263 exact source service");
                for(size_t i=0;i<expected.size();++i)
                {
                    const auto & spell=mass["spells"].Vector()[i];
                    if(!spell.isString() || spell.String()!=expected[i])
                        throw std::runtime_error("ERA mass spell source identity mismatch");
                    const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"spell",spell.String(),true);
                    if(!id)throw std::runtime_error("ERA mass spell unavailable "+spell.String());
                    massSpells.emplace(entry.first,*id);
                }
            }
            const auto & opening=entry.second["openingSummons"];
            if(!opening.isNull())
            {
                if(!opening.isVector() || opening.Vector().empty() || opening.Vector().size()>9)
                    throw std::runtime_error("ERA artifact requires 1..9 ordered opening summons");
                auto & out=summons[entry.first];
                for(const auto & item:opening.Vector())
                {
                    const auto & power=item["encodedPower"];
                    if(!item.isStruct() || item.Struct().size()!=2 || !power.isNumber()
                        || power.Float()!=power.Integer() || power.Float() < -2147483648.0 || power.Float()>2147483647.0)
                        throw std::runtime_error("ERA opening summon requires creature and signed integer encodedPower");
                    out.push_back({creature(item["creature"]),static_cast<int>(power.Integer())});
                }
            }
            if(entry.second["dailyConversions"].isNull())continue;
            if(!entry.second["dailyConversions"].isVector())
                throw std::runtime_error("ERA artifact dailyConversions must be an array");
            const auto & pairs = entry.second["dailyConversions"].Vector();
            if(pairs.empty() || pairs.size() > 9)
                throw std::runtime_error("ERA artifact must have 1..9 ordered conversion pairs");
            auto & out = conversions[entry.first];
            for(const auto & pair : pairs)
            {
                if(!pair.isStruct() || pair.Struct().size() != 2 || pair["from"].isNull() || pair["to"].isNull())
                    throw std::runtime_error("ERA artifact conversion requires exactly from and to");
                out.push_back({creature(pair["from"]), creature(pair["to"])});
            }
        }
    }
    const std::vector<::era_bridge::DailyConversion> * dailyConversions(const std::string & artifact) const
    {
        const auto found = conversions.find(artifact);
        return found == conversions.end() ? nullptr : &found->second;
    }
    const std::vector<::era_bridge::OpeningSummon> * openingSummons(const std::string & artifact) const
    {
        const auto found=summons.find(artifact);
        return found==summons.end() ? nullptr : &found->second;
    }
    bool exchangeCloak(const std::string & artifact) const
    {
        return exchangeCloaks.count(artifact)!=0;
    }
    bool massSpell(const std::string & artifact,int spell) const
    {
        return massSpells.count({artifact,spell})!=0;
    }
    std::optional<bool> goldenGoose(const std::string & artifact) const
    {
        const auto found=goldenGeese.find(artifact);
        return found==goldenGeese.end()?std::nullopt:std::optional<bool>(found->second);
    }
    bool reflection(const std::string & artifact) const
    {
        return reflections.count(artifact)!=0;
    }
    bool elementalFreedom(const std::string & artifact) const
    {
        return elementalRings.count(artifact)!=0;
    }
    static const ArtifactPolicies & get()
    {
        static const ArtifactPolicies policies;
        return policies;
    }
};
}
VCMI_LIB_NAMESPACE_END
