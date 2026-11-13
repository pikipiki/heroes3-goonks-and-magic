/* Whole source286 U/k/p registry, GPL-2.0-or-later. */
#pragma once
#include "EraDemilichSummonRule.h"
#include "../GameLibrary.h"
#include "../constants/EntityIdentifiers.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class DemilichSummons
{
    bool active=false;
    CreatureID wight;
public:
    DemilichSummons()
    {
        const auto path=JsonPath::builtin("config/era-bridge-demilich-summons");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct()||root.Struct().size()!=2||!root["schemaVersion"].isNumber()||root["schemaVersion"].Float()!=1
            ||!root["creatures"].isVector()||root["creatures"].Vector().size()!=1
            ||!root["creatures"].Vector()[0].isString()||root["creatures"].Vector()[0].String()!="tum-era:eraCreature286")
            throw std::runtime_error("ERA Demilich: exact source286 summon contract required");
        const JsonNode status(JsonPath::builtin("config/era-bridge-status-attacks"));
        if(!status["creatures"].isVector()||!status["sourceIds"].isStruct())throw std::runtime_error("ERA Demilich: status registry required");
        const auto & ids=status["sourceIds"];
        if(!ids["tum-era:eraCreature286"].isNumber()||ids["tum-era:eraCreature286"].Float()!=286
            ||!ids["core:wight"].isNumber()||ids["core:wight"].Float()!=60)
            throw std::runtime_error("ERA Demilich: source286 and Wight60 identities required");
        bool poison=false;
        for(const auto & actor:status["creatures"].Vector())
            if(actor.isString()&&actor.String()=="tum-era:eraCreature286")poison=true;
        const JsonNode attacks(JsonPath::builtin("config/era-bridge-experience-attack-spells"));
        if(!attacks["creatures"]["tum-era:eraCreature286"].isVector())throw std::runtime_error("ERA Demilich: XP spell registry required");
        bool ripple=false;
        for(const auto & spell:attacks["creatures"]["tum-era:eraCreature286"].Vector())
            if(spell.isString()&&spell.String()=="core:deathRipple")ripple=true;
        if(!poison||!ripple)throw std::runtime_error("ERA Demilich: whole p24/k71/U60 feature required");
        const auto target=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"creature","core:wight",true);
        if(!target)throw std::runtime_error("ERA Demilich: unresolved original Wight60");
        wight=CreatureID(*target);active=true;
    }
    bool enabled(const std::string & key)const{return active&&key=="tum-era:eraCreature286";}
    CreatureID summonedCreature()const{return wight;}
    static const DemilichSummons & get(){static const DemilichSummons policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
