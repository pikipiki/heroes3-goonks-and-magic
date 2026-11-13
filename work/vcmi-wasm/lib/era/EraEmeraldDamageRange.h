/* Source endpoint arithmetic for verified Emerald Eyes only; no new bonus. */
#pragma once
#include "EraEmeraldDamageRangeRule.h"
#include "../GameLibrary.h"
#include "../battle/Unit.h"
#include "../entities/artifact/CArtifact.h"
#include "../bonuses/Bonus.h"
#include "../bonuses/BonusSelector.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include <vector>
#include <initializer_list>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class EmeraldDamageArtifacts
{
    std::vector<ArtifactID> identities;
public:
    EmeraldDamageArtifacts()
    {
        struct Expected{const char * key;int low;int high;};
        // Emerald cfg:273min1,274max1,275min2,276max2,277both2,278both5.
        // Missing future actors/artifacts stay absent. Existing keys with a
        // modified endpoint definition do not opt in by their name alone.
        for(const auto & expected:std::initializer_list<Expected>{
            {"tum-era:artifact273",1,0},{"tum-era:artifact274",0,1},
            {"tum-era:artifact275",2,0},{"tum-era:artifact276",0,2},
            {"tum-era:artifact277",2,2},{"tum-era:artifact278",5,5}})
        {
            const auto found=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact",expected.key,true);
            if(!found)continue;
            const ArtifactID id(*found);
            int64_t low=0,high=0;int count=0;bool exact=true;
            for(const auto & bonus:id.toArtifact()->getExportedBonusList())
            {
                if(bonus->type!=BonusType::CREATURE_DAMAGE)continue;
                ++count;
                if(bonus->subtype==BonusCustomSubtype::creatureDamageMin)low+=bonus->val;
                else if(bonus->subtype==BonusCustomSubtype::creatureDamageMax)high+=bonus->val;
                else exact=false;
                if(bonus->valType!=BonusValueType::ADDITIVE_VALUE)exact=false;
            }
            if(exact && low==expected.low && high==expected.high
                && count==static_cast<int>(expected.low!=0)+static_cast<int>(expected.high!=0))identities.push_back(id);
        }
    }
    bool contributes(const battle::Unit & actor)const
    {
        for(const auto & id:identities)
            if(actor.hasBonus(Selector::type()(BonusType::CREATURE_DAMAGE)
                .And(Selector::source(BonusSource::ARTIFACT,BonusSourceID(id)))))return true;
        return false;
    }
    static const EmeraldDamageArtifacts & get(){static const EmeraldDamageArtifacts value;return value;}
};
inline bool sourceEmeraldDamageEndpoints(const battle::Unit & actor)
{
    return EmeraldDamageArtifacts::get().contributes(actor);
}
}
VCMI_LIB_NAMESPACE_END
