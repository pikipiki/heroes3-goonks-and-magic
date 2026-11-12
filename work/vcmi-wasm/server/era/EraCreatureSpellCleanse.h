#pragma once
#include "../../lib/era/EraCreatureSpellImmunityRuntime.h"
#include "../../lib/battle/IBattleState.h"
#include "../../lib/networkPacks/SetStackEffect.h"
#include "../CGameHandler.h"
inline void applyEraCreatureSpellCleanse(CGameHandler & handler,const CBattleInfoCallback & battle)
{
    SetStackEffect removed;removed.battleID=battle.getBattle()->getBattleID();
    for(const auto * target:battle.battleGetAllStacks())
    {
        // Original script iterates source slots0..41, tests N>0, and has no
        // caster-kind or hostile-spell test. Hero debuffs are removed as well.
        const int slot=target->sourceMassSlot();
        if(!target->alive() || slot<0 || slot>41
            || !::era_bridge::sourceCreatureSpellImmune(sourceCreatureSpellImmunityId(target)))continue;
        std::vector<Bonus> spells;
        for(const auto & bonus:*target->getBonuses(Selector::sourceTypeSel(BonusSource::SPELL_EFFECT)))
            if(::era_bridge::cleansesCreatureSpell(bonus->sid.as<SpellID>().getNum()))spells.push_back(*bonus);
        if(!spells.empty())removed.toRemove.emplace_back(target->unitId(),std::move(spells));
    }
    if(!removed.toRemove.empty())handler.sendAndApply(removed);
}
