/* AfterDefendSpell27 then28, source10580..10615; GPL-2.0-or-later. */
#pragma once
#include "../../lib/era/EraPrimalFaerie.h"
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/spells/AbilityCaster.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/spells/ISpellMechanics.h"
#include "../CGameHandler.h"
namespace era_compat_server
{
inline void primalFaerieAfterDefend(CGameHandler & handler,const CBattleInfoCallback & battle,const CStack * actor)
{
    if(!actor || !actor->alive() || battle.battleTacticDist()
        || !era_compat::PrimalFaerie::get().enabled(actor->creatureId().toCreature()->getJsonKey()))return;
    //7157F6 passes CREATUREkind1 into5A0140: its5A0145 hook overrides
    // the literal power1 from AfterDefend with count*10+1 (including duration).
    const int power=::era_bridge::SourceCreatureSpellPower::forSource(258).apply(actor->getCount());
    spells::AbilityCaster caster(actor,2);
    for(const auto id:{27,28})
    {
        if(!actor->alive())break;
        spells::BattleCast cast(&battle,&caster,spells::Mode::PASSIVE,SpellID(id).toSpell());
        cast.setSpellLevel(2);cast.setEffectPower(power);cast.setEffectDuration(power);
        spells::Target target;target.emplace_back(actor);
        // These are automatic effects; the ten manual spell charges are neither
        // required nor spent. Each source slot is attempted independently.
        cast.cast(handler.spellcastEnvironment(),target);
    }
}
}
