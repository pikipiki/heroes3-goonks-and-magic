/* Source238 MR0 belongs to HERO_CAST and CURRENT side, not every hero proxy. */
#pragma once
#include "EraOrbChaos238.h"
#include "EraConfluxPolicies.h"
#include "../GameLibrary.h"
#include "../spells/CSpellHandler.h"
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../modding/IdentifierStorage.h"
#include "../modding/ModScope.h"
#include "../entities/artifact/CArtifactInstance.h"
#include <optional>
#include <stdexcept>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
// BG:A belongs to the outer battle action, including nested passive effects.
inline thread_local std::optional<bool> orbChaosHeroAction;
class OrbChaosActionScope
{
    std::optional<bool> previous;
public:
    explicit OrbChaosActionScope(bool heroAction):previous(orbChaosHeroAction){orbChaosHeroAction=heroAction;}
    ~OrbChaosActionScope(){orbChaosHeroAction=previous;}
    OrbChaosActionScope(const OrbChaosActionScope &)=delete;
    OrbChaosActionScope & operator=(const OrbChaosActionScope &)=delete;
};
struct OrbChaosCastContext
{
    bool heroAction=false;
    const CBattleInfoCallback * battle=nullptr;
    BattleSide currentSide=BattleSide::NONE;
};
inline thread_local std::optional<OrbChaosCastContext> orbChaosCastContext;
class OrbChaosCastScope
{
    std::optional<OrbChaosCastContext> previous;
public:
    OrbChaosCastScope(bool heroAction,const CBattleInfoCallback * battle,BattleSide fallback)
        :previous(orbChaosCastContext)
    {
        auto side=battle?confluxActiveSide(*battle):BattleSide::NONE;
        if(side==BattleSide::NONE)side=fallback;
        orbChaosCastContext=OrbChaosCastContext{orbChaosHeroAction.value_or(heroAction),battle,side};
    }
    ~OrbChaosCastScope(){orbChaosCastContext=previous;}
    OrbChaosCastScope(const OrbChaosCastScope &)=delete;
    OrbChaosCastScope & operator=(const OrbChaosCastScope &)=delete;
};
class OrbChaos238
{
    std::optional<ArtifactID> artifact;
public:
    OrbChaos238()
    {
        const auto path=JsonPath::builtin("config/era-orb-chaos238-artifact");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=2 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["artifact"].isString()
            || root["artifact"].String()!="tum-era:artifact238")
            throw std::runtime_error("Invalid source238 Orb Chaos binding");
        const auto identity=LIBRARY->identifiers()->getIdentifier(ModScope::scopeGame(),"artifact","tum-era:artifact238",true);
        if(!identity)throw std::runtime_error("Unresolved source238 Orb Chaos artifact");
        artifact=ArtifactID(*identity);
    }
    bool equipped(const CGHeroInstance * hero)const
    {
        if(!artifact || !hero)return false;
        for(int slot=0;slot<19;++slot)
            if(const auto * item=hero->getArt(ArtifactPosition(slot));item && item->getTypeId()==*artifact)return true;
        return false;
    }
    static const OrbChaos238 & get(){static const OrbChaos238 policy;return policy;}
};
inline bool eraOrbChaosRawDamageActive(const spells::Caster * caster,const CSpell * spell,const battle::Unit * target)
{
    if(!caster || !spell || !target || !spell->isDamage() || !orbChaosCastContext
        || !orbChaosCastContext->heroAction || !orbChaosCastContext->battle)return false;
    const auto side=orbChaosCastContext->currentSide;
    if(side!=BattleSide::ATTACKER && side!=BattleSide::DEFENDER)return false;
    return OrbChaos238::get().equipped(orbChaosCastContext->battle->battleGetFightingHero(side));
}
inline std::optional<int64_t> applyEraOrbChaosRawDamage(const spells::Caster * caster,const CSpell * spell,
    const battle::Unit * target,int64_t correctedCasterRaw)
{
    if(!eraOrbChaosRawDamageActive(caster,spell,target))return std::nullopt;
    return ::era_bridge::sourceOrbChaosDamage(correctedCasterRaw);
}
}
VCMI_LIB_NAMESPACE_END
