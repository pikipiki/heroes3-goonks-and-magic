/* Source Faerie258 casting context; no355/356 actor policy in this checkpoint. GPL-2.0-or-later. */
#pragma once
#include "EraPrimalFaerie.h"
#include "../CStack.h"
#include "../CCreatureHandler.h"
#include <optional>
VCMI_LIB_NAMESPACE_BEGIN
namespace era_compat
{
inline bool sourceFaeriePoolActor(const battle::Unit * unit)
{return unit && PrimalFaerie::get().enabled(unit->creatureId().toCreature()->getJsonKey());}
inline thread_local std::optional<BattleSide> confluxCurrentSide;
inline thread_local std::optional<int> confluxCastKind;
inline thread_local std::optional<bool> confluxHeroResistanceQuery;
inline thread_local std::optional<BattleSide> confluxQuerySide;
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
}
VCMI_LIB_NAMESPACE_END
