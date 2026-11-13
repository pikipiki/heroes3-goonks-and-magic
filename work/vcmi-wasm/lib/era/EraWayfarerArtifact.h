/* TUM260: human Expert Pathfinding input; AI receives a daily field increment. */
#pragma once
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include "../mapObjects/CGHeroInstance.h"
#include "../entities/artifact/CArtifact.h"
#include "../entities/artifact/CArtifactInstance.h"
#include <optional>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class WayfarerArtifact
{
    std::optional<ArtifactID> identity;
public:
    WayfarerArtifact()
    {
        const auto path=JsonPath::builtin("config/era-wayfarer-artifact");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifact"].isString()
            || root["artifact"].String()!="tum-era:artifact260")
            throw std::runtime_error("Invalid original260 Wayfarer binding");
        const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact","tum-era:artifact260",true);
        if(!id)throw std::runtime_error("Unresolved original260 Wayfarer artifact");
        identity=ArtifactID(*id);
        const auto & bonuses=identity->toArtifact()->getExportedBonusList();
        if(bonuses.getFirst(Selector::type()(BonusType::NO_TERRAIN_PENALTY))
            || bonuses.getFirst(Selector::type()(BonusType::MOVEMENT)))
            throw std::runtime_error("Original260 needs separate human/AI events, not inherited movement bonuses");
    }
    std::optional<ArtifactID> artifact()const{return identity;}
    bool equipped(const CGHeroInstance & hero)const
    {
        if(!identity)return false;
        for(int slot=0;slot<19;++slot)
            if(const auto * item=hero.getArt(ArtifactPosition(slot)))
                if(item->getTypeId()==*identity)return true;
        return false;
    }
    static const WayfarerArtifact & get(){static const WayfarerArtifact value;return value;}
};
}
VCMI_LIB_NAMESPACE_END
