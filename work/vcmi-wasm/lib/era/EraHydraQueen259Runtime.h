/* Exact initialized-stack259 addition. No general LIFE_DRAIN heuristic. */
#pragma once
#include "EraHydraQueen259.h"
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include "../entities/artifact/CArtifact.h"
#include "../entities/artifact/CArtifactInstance.h"
#include "../CStack.h"
#include <map>
#include <optional>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class HydraQueen259
{
    std::optional<ArtifactID> artifact;
    std::map<std::string,int> sourceIds;
public:
    HydraQueen259()
    {
        const auto path=JsonPath::builtin("config/era-hydra-queen259-artifact");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifact"].isString()
            || root["artifact"].String()!="tum-era:artifact259")
            throw std::runtime_error("Invalid source259 Hydra Queen binding");
        const auto identity=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact","tum-era:artifact259",true);
        if(!identity)throw std::runtime_error("Unresolved source259 artifact");
        artifact=ArtifactID(*identity);
        const auto registry=JsonPath::builtin("config/era-bridge-status-attacks");
        if(!CResourceHandler::get()->existsResource(registry))throw std::runtime_error("Source259 needs canonical creature source IDs");
        const JsonNode creatures(registry);
        if(!creatures["sourceIds"].isStruct())throw std::runtime_error("Source259 missing creature source IDs");
        for(const auto & entry:creatures["sourceIds"].Struct())
        {
            if(!entry.second.isNumber() || entry.second.Float()!=entry.second.Integer()
                || entry.second.Integer()<0 || entry.second.Integer()>65535)
                throw std::runtime_error("Invalid source259 creature identity");
            sourceIds.emplace(entry.first,static_cast<int>(entry.second.Integer()));
        }
    }
    static const HydraQueen259 & get(){static const HydraQueen259 policy;return policy;}
    void initialize(CStack & stack,const CGHeroInstance * hero)const
    {
        if(!artifact || !hero)return;
        bool equipped=false;
        for(int position=0;position<19;++position)
            if(const auto * item=hero->getArt(ArtifactPosition(position));item && item->getTypeId()==*artifact)
                equipped=true;
        if(!equipped)return;
        const auto key=stack.creatureId().toCreature()->getJsonKey();
        const auto found=sourceIds.find(key);
        const int sourceId=found==sourceIds.end()?-1:found->second;
        if(!::era_bridge::sourceHydraQueenEligible(stack.creatureId()==CreatureID::ARROW_TOWERS,
            stack.doubleWide(),stack.hasBonusOfType(BonusType::TWO_HEX_ATTACK_BREATH),sourceId))return;
        const auto selector=Selector::type()(BonusType::ATTACKS_ALL_ADJACENT)
            .And(Selector::source(BonusSource::ARTIFACT,BonusSourceID(*artifact)));
        if(stack.getFirstBonus(selector))return; // localInit is also called after native save/load.
        stack.addNewBonus(std::make_shared<Bonus>(BonusDuration::ONE_BATTLE,
            BonusType::ATTACKS_ALL_ADJACENT,BonusSource::ARTIFACT,0,BonusSourceID(*artifact)));
    }
};
}
VCMI_LIB_NAMESPACE_END
