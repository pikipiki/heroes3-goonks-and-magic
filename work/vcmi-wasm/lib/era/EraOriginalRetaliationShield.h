/* Original WoG157: transient NoRetaliation-bit override at441AFF only. */
#pragma once
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include "../battle/CBattleInfoCallback.h"
#include "../battle/IBattleState.h"
#include "../battle/Unit.h"
#include "../entities/artifact/CArtifact.h"
#include "../entities/artifact/CArtifactInstance.h"
#include "../mapObjects/CGHeroInstance.h"
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class OriginalRetaliationShield
{
    bool active=false;
public:
    static constexpr const char * identity="wake-of-gods.artifacts:crimsonShieldOfRetribution";
    OriginalRetaliationShield()
    {
        const auto resource=JsonPath::builtin("config/era-original-retaliation-shield");
        if(!CResourceHandler::get()->existsResource(resource))return;
        const JsonNode root(resource);
        const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact",identity,true);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifact"].isString()
            || root["artifact"].String()!=identity || !id)
            throw std::runtime_error("Invalid original157 retaliation shield identity");
        const auto * artifact=ArtifactID(*id).toArtifact();
        if(artifact->getExportedBonusList().getFirst(Selector::type()(BonusType::CREATURE_DAMAGE))
            || artifact->valOfBonuses(BonusType::PRIMARY_SKILL,BonusSubtypeID(PrimarySkill::DEFENSE))!=2)
            throw std::runtime_error("Original157 requires Defence2 and removal of the old damage adaptation");
        active=true;
    }
    bool equipped(const CBattleInfoCallback & battle,const battle::Unit & defender)const
    {
        if(!active)return false;
        // Original70A014 flips original side when Hypnotize duration+288>0.
        const auto side=battle.playerToSide(battle.battleGetOwner(&defender));
        if(side!=BattleSide::ATTACKER && side!=BattleSide::DEFENDER)return false;
        const auto * hero=battle.getBattle()->getSideHero(side);if(!hero)return false;
        for(int slot=0;slot<19;++slot)
            if(const auto * item=hero->getArt(ArtifactPosition(slot)))
                if(item->getType()->getJsonKey()==identity)return true;
        return false;
    }
    static const OriginalRetaliationShield & get(){static const OriginalRetaliationShield policy;return policy;}
};
}
VCMI_LIB_NAMESPACE_END
