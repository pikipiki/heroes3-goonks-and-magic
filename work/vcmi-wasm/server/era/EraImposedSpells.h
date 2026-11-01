/* ERA imposed creature enchantments; GPL-2.0-or-later. */
#pragma once
#include "../CGameHandler.h"
#include "../../lib/CStack.h"
#include "../../lib/CCreatureHandler.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/era/EraBridgePolicies.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/spells/ISpellMechanics.h"

// Source ImposedSpellsGeneral (tables.cpp:4359): no cast, target filtering,
// resistance roll, charge use or caster power. Directly impose spell/mastery
// for 1000 rounds, including mastery zero. Trigger only for stack creation.
inline void applyEraImposedSpells(CGameHandler & handler,
    const CBattleInfoCallback & battle, const CStack * stack)
{
    if(!stack || !stack->alive())
        return;
    const auto & slots = era_compat::Policies::get().imposedSpells(stack->unitType()->getJsonKey());
    for(const auto & slot : slots)
    {
        const SpellID id(SpellID::decode(slot.spell));
        if(!id.hasValue())
            throw std::runtime_error("ERA bridge: unresolved imposed spell " + slot.spell);
        spells::BattleCast cast(&battle, stack, spells::Mode::PASSIVE, id.toSpell());
        cast.setSpellLevel(slot.mastery);
        cast.setEffectDuration(1000);
        // Original direct enchant operation has no spell-power parameter.
        // Duration is explicit; imposed buff magnitude comes from mastery.
        cast.setEffectPower(0);
        spells::Target target;
        target.emplace_back(stack);
        cast.applyEffects(handler.spellcastEnvironment(), target, false, true);
    }
}
