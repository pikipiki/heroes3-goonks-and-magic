/* Whole original355/356 opt-in. GPL-2.0-or-later. */
#pragma once
#include "../filesystem/Filesystem.h"
#include "../json/JsonNode.h"
#include "../battle/CBattleInfoCallback.h"
#include "../CStack.h"
#include "../CCreatureHandler.h"
#include "EraPrimalFaerie.h"
#include "EraOriginalFaerie.h"
#include "EraDragonlingFaerie.h"
#include <optional>
#include <string>
#include <set>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
class ConfluxPolicies
{
    bool active=false;
    std::set<std::string> spellArtifactReset;
public:
    ConfluxPolicies()
    {
        const auto path=JsonPath::builtin("config/era-bridge-conflux");
        if(!CResourceHandler::get()->existsResource(path))return;
        const JsonNode root(path);
        if(!root.isStruct() || root.Struct().size()!=3 || !root["schemaVersion"].isNumber()
            || root["schemaVersion"].Float()!=1 || !root["creatures"].isVector()
            || root["creatures"].Vector().size()!=2
            || !root["creatures"].Vector()[0].isString() || !root["creatures"].Vector()[1].isString()
            || root["creatures"].Vector()[0].String()!="tum-era:eraCreature355"
            || root["creatures"].Vector()[1].String()!="tum-era:eraCreature356")
            throw std::runtime_error("ERA Conflux: whole355/356 source contract required");
        const auto & resets=root["spellArtifactReset"];
        if(!resets.isVector())throw std::runtime_error("ERA Conflux: source spell-artifact reset list required");
        for(const auto & entry:resets.Vector())
            if(!entry.isString() || !spellArtifactReset.insert(entry.String()).second)
                throw std::runtime_error("ERA Conflux: duplicate/invalid source spell-artifact reset");
        const std::set<std::string> expected{
            "core:spellScroll","core:tomeOfFireMagic","core:tomeOfAirMagic","core:tomeOfWaterMagic",
            "core:tomeOfEarthMagic","core:seaCaptainsHat","core:spellbindersHat","core:armageddonsBlade",
            "core:titansThunder","core:admiralsHat","tum-era:artifact192","tum-era:artifact193",
            "tum-era:artifact194","tum-era:artifact195","tum-era:artifact197","tum-era:artifact198",
            "tum-era:artifact219","tum-era:artifact220","tum-era:artifact232","tum-era:artifact279"};
        if(spellArtifactReset!=expected)throw std::runtime_error("ERA Conflux: exact original/TUM spellflag closure required");
        active=true;
    }
    bool enabled()const{return active;}
    bool resetsTome(const std::string & artifactKey)const{return active && spellArtifactReset.count(artifactKey)!=0;}
    bool is355(const std::string & key)const{return active && key=="tum-era:eraCreature355";}
    bool is356(const std::string & key)const{return active && key=="tum-era:eraCreature356";}
    bool owns(const std::string & key)const{return is355(key)||is356(key);}
    static const ConfluxPolicies & get(){static const ConfluxPolicies policy;return policy;}
};
inline bool sourceFaeriePoolActor(const battle::Unit * unit)
{
    if(!unit)return false;
    const auto & key=unit->creatureId().toCreature()->getJsonKey();
    return ConfluxPolicies::get().is356(key) || PrimalFaerie::get().enabled(key)
        || OriginalFaerie::get().enabled(key) || DragonlingFaerie::get().enabled(key);
}
// Original currentActiveSide is independent of currentMonSide/currentMonIndex.
// WoG_CastSpell_Monster temporarily sets all three; nested casts restore them.
inline thread_local std::optional<BattleSide> confluxCurrentSide;
inline thread_local std::optional<int> confluxCastKind;
inline thread_local std::optional<bool> confluxHeroResistanceQuery;
inline thread_local std::optional<BattleSide> confluxQuerySide;
// Physical normal retaliation flips132C0 without replacing the current
// creature132B8/BC or pretending that an ordinary native cast is kind1.
class ConfluxCurrentSideScope
{
    std::optional<BattleSide> previous;
public:
    explicit ConfluxCurrentSideScope(BattleSide side):previous(confluxCurrentSide){confluxCurrentSide=side;}
    ~ConfluxCurrentSideScope(){confluxCurrentSide=previous;}
    ConfluxCurrentSideScope(const ConfluxCurrentSideScope &)=delete;
    ConfluxCurrentSideScope & operator=(const ConfluxCurrentSideScope &)=delete;
};
class ConfluxResistanceScope
{
    std::optional<bool> previous;
    std::optional<BattleSide> previousSide;
public:
    explicit ConfluxResistanceScope(bool heroQuery,std::optional<BattleSide> querySide=std::nullopt)
        :previous(confluxHeroResistanceQuery),previousSide(confluxQuerySide)
    {confluxHeroResistanceQuery=heroQuery;if(querySide)confluxQuerySide=querySide;}
    ~ConfluxResistanceScope(){confluxHeroResistanceQuery=previous;confluxQuerySide=previousSide;}
    ConfluxResistanceScope(const ConfluxResistanceScope &)=delete;
    ConfluxResistanceScope & operator=(const ConfluxResistanceScope &)=delete;
};
// Direct kind1/5A0140 status calls use a query-side hero without changing
// CURRENT132C0. This also covers queued468CE2, not the WoG monster wrapper.
class ConfluxCastQueryScope
{
    std::optional<int> previousKind;
    ConfluxResistanceScope query;
public:
    explicit ConfluxCastQueryScope(BattleSide side,int kind)
        :previousKind(confluxCastKind),query(true,side){confluxCastKind=kind>2?1:kind;}
    ~ConfluxCastQueryScope(){confluxCastKind=previousKind;}
    ConfluxCastQueryScope(const ConfluxCastQueryScope &)=delete;
    ConfluxCastQueryScope & operator=(const ConfluxCastQueryScope &)=delete;
};
class ConfluxSideScope
{
    std::optional<BattleSide> previous;
    std::optional<int> previousKind;
    std::optional<BattleSide> previousQuerySide;
public:
    explicit ConfluxSideScope(BattleSide side,int kind):previous(confluxCurrentSide),previousKind(confluxCastKind),previousQuerySide(confluxQuerySide)
    {confluxCurrentSide=side;confluxQuerySide=side;confluxCastKind=kind>2?1:kind;}
    ~ConfluxSideScope(){confluxCurrentSide=previous;confluxCastKind=previousKind;confluxQuerySide=previousQuerySide;}
    ConfluxSideScope(const ConfluxSideScope &)=delete;
    ConfluxSideScope & operator=(const ConfluxSideScope &)=delete;
};
inline BattleSide confluxActiveSide(const CBattleInfoCallback & battle)
{
    if(confluxCurrentSide)return *confluxCurrentSide;
    const auto * active=battle.battleActiveUnit();if(!active)return BattleSide::NONE;
    auto side=active->unitSide();
    if(active->isHypnotized())side=side==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER;
    return side;
}
inline bool confluxCatalystNegates(const CBattleInfoCallback & battle,BattleSide casterSide,bool heroQuery)
{
    //5A83B1 loads hero(querySide) even for its misleadingly named noHero1
    //argument.5A017B's NULL applies to direct damage correction, not this query.
    heroQuery=heroQuery || confluxCastKind.has_value() || confluxHeroResistanceQuery.value_or(false);
    if(!heroQuery || !ConfluxPolicies::get().enabled()
        || (casterSide!=BattleSide::ATTACKER && casterSide!=BattleSide::DEFENDER)
        || !battle.battleHasHero(casterSide))return false;
    const auto side=confluxActiveSide(battle);
    if(side!=BattleSide::ATTACKER && side!=BattleSide::DEFENDER)return false;
    for(const auto * stack:battle.battleGetAllStacks(false))
        if(stack->unitSide()==side && stack->alive() && stack->getCount()>0
            && stack->sourceMassSlot()>=0 && stack->sourceMassSlot()<21
            && ConfluxPolicies::get().is356(stack->creatureId().toCreature()->getJsonKey()))return true;
    return false;
}
}
VCMI_LIB_NAMESPACE_END
