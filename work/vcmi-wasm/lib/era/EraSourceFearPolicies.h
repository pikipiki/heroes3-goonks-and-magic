/* Explicit opt-in registry. No global FEARFUL or combat bias override. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../GameLibrary.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include <map>
#include <set>
#include <string>
#include <stdexcept>
#include <cmath>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
struct SourceFearPolicy { int sourceId; int firstRank; std::string marker; };
class SourceFearPolicies
{
    std::map<std::string, SourceFearPolicy> creatures;
    std::set<std::string> fallbackTargets;
    static void resolveCreature(const std::string & key)
    {
        const auto colon = key.find(':');
        if(colon == std::string::npos || colon == 0 || colon + 1 == key.size()
            || key.find(':',colon + 1) != std::string::npos)
            throw std::runtime_error("ERA fear: qualified creature ID required");
        const auto id = LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"creature",key,true);
        if(!id || *id < 0)
            throw std::runtime_error("ERA fear: unresolved creature " + key);
    }
    static int integer(const JsonNode & node, int min, int max)
    {
        if(!node.isNumber() || !std::isfinite(node.Float()) || std::floor(node.Float()) != node.Float()
            || node.Float() < min || node.Float() > max)
            throw std::runtime_error("ERA fear: invalid integer");
        return static_cast<int>(node.Float());
    }
public:
    SourceFearPolicies()
    {
        const auto file = JsonPath::builtin("config/era-bridge-fear");
        if(!CResourceHandler::get()->existsResource(file))
            return;
        const JsonNode root(file);
        if(!root.isStruct() || root.Struct().size() != 3
            || integer(root["schemaVersion"],1,1) != 1
            || !root["creatures"].isStruct() || !root["nativeFallbackTargets"].isVector())
            throw std::runtime_error("ERA fear: invalid registry");
        std::set<int> ids;
        for(const auto & entry : root["creatures"].Struct())
        {
            resolveCreature(entry.first);
            const auto & p = entry.second;
            if(entry.first.find(':') == std::string::npos || !p.isStruct() || p.Struct().size() != 3)
                throw std::runtime_error("ERA fear: qualified creature policy required");
            const int id = integer(p["sourceId"],0,999), rank = integer(p["firstRank"],0,10);
            const std::string marker = "eraSourceFear:" + std::to_string(id) + ":v1";
            if(!p["marker"].isString() || p["marker"].String() != marker || !ids.insert(id).second)
                throw std::runtime_error("ERA fear: invalid/duplicate source marker");
            creatures.emplace(entry.first, SourceFearPolicy{id,rank,marker});
        }
        for(const auto & entry : root["nativeFallbackTargets"].Vector())
        {
            if(!entry.isString() || entry.String().find(':') == std::string::npos
                || !fallbackTargets.insert(entry.String()).second)
                throw std::runtime_error("ERA fear: invalid fallback target");
            resolveCreature(entry.String());
        }
    }
    const SourceFearPolicy * find(const std::string & id) const
    {
        const auto it = creatures.find(id);
        return it == creatures.end() ? nullptr : &it->second;
    }
    bool empty() const { return creatures.empty(); }
    bool fallbackTarget(const std::string & id) const { return fallbackTargets.count(id) != 0; }
    bool canonical(const std::string & marker) const
    {
        for(const auto & entry : creatures)
            if(entry.second.marker == marker)
                return true;
        return false;
    }
    static const SourceFearPolicies & get()
    {
        static const SourceFearPolicies policies;
        return policies;
    }
};
}
VCMI_LIB_NAMESPACE_END
