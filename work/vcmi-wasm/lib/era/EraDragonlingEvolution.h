/* Strict source341–345 daily evolution; absent document leaves it disabled. */
#pragma once
#include "EraDragonlingEvolutionRule.h"
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include <map>
#include <string>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class DragonlingEvolution
{
    bool active=false;
    std::map<int,int> targets;
    static int creature(const std::string & key)
    {
        const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"creature",key,true);
        if(!id)throw std::runtime_error("ERA dragonling evolution: unresolved actual creature "+key);
        return *id;
    }
public:
    DragonlingEvolution()
    {
        const auto path=JsonPath::builtin("config/era-bridge-dragonling-evolution");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=4 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["rebornEnabled"].isBool()
            || !root["minimumRank"].isNumber() || root["minimumRank"].Float()!=10
            || !root["pairs"].isVector() || root["pairs"].Vector().size()!=5)
            throw std::runtime_error("ERA dragonling evolution: exact whole daily341–345 contract required");
        const char * expectedTargets[]={"core:greenDragon","core:redDragon","core:fairieDragon","core:rustDragon","core:azureDragon"};
        for(int i=0;i<5;++i)
        {
            const auto & pair=root["pairs"].Vector()[i];
            const auto source="tum-era:eraCreature"+std::to_string(341+i);
            if(!pair.isStruct() || pair.Struct().size()!=2 || !pair["from"].isString()
                || pair["from"].String()!=source || !pair["to"].isString()
                || pair["to"].String()!=expectedTargets[i])
                throw std::runtime_error("ERA dragonling evolution: changed original ordered pair");
            // Reborn suppresses the script, including dependency resolution.
            if(!root["rebornEnabled"].Bool())targets.emplace(creature(source),creature(expectedTargets[i]));
        }
        active=!root["rebornEnabled"].Bool();
    }
    int target(int nativeId,int rank)const
    {
        if(!active || rank<10)return -1;
        const auto found=targets.find(nativeId);
        return found==targets.end()?-1:found->second;
    }
    static const DragonlingEvolution & get(){static const DragonlingEvolution policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
