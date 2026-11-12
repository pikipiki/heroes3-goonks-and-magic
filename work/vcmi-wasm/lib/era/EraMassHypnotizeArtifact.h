/* Emerald253 untargeted Hypnotize: real hero HP threshold, explicit duration50. */
#pragma once
#include "../GameLibrary.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include "../entities/artifact/CArtifact.h"
#include "../bonuses/Bonus.h"
#include <stdexcept>
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class MassHypnotizeArtifact
{
    std::optional<ArtifactID> identity;
public:
    MassHypnotizeArtifact()
    {
        const auto path=JsonPath::builtin("config/era-mass-hypnotize-artifact");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifact"].isString()
            || root["artifact"].String()!="tum-era:artifact253")
            throw std::runtime_error("Invalid original253 Hypnotize binding");
        const auto id=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact","tum-era:artifact253",true);
        if(!id)throw std::runtime_error("Unresolved original253 Hypnotize artifact");
        identity=ArtifactID(*id);
        const auto bonus=identity->toArtifact()->getExportedBonusList().getFirst(Selector::type()(BonusType::OPENING_BATTLE_SPELL));
        if(!bonus || bonus->subtype!=BonusSubtypeID(SpellID(60)) || bonus->val!=50)
            throw std::runtime_error("Original253 requires expert opening Hypnotize duration50");
    }
    bool matches(const Bonus & bonus)const
    {return identity && bonus.source==BonusSource::ARTIFACT && bonus.sid==BonusSourceID(*identity)
        && bonus.type==BonusType::OPENING_BATTLE_SPELL && bonus.subtype==BonusSubtypeID(SpellID(60));}
    static const MassHypnotizeArtifact & get(){static const MassHypnotizeArtifact value;return value;}
};
}
VCMI_LIB_NAMESPACE_END
