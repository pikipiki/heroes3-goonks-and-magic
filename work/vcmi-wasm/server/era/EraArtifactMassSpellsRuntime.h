/* TUM source262/263: named post-hero-cast operation, not arbitrary ERM. */
#pragma once
#include "../../lib/era/EraInterferenceState.h"
#include "../CGameHandler.h"
#include "EraRebirth.h"
#include "../../lib/CStack.h"
#include "../../lib/battle/CBattleInfoCallback.h"
#include "../../lib/era/EraArtifactMassSpells.h"
#include "../../lib/era/EraBridgeArtifactPolicies.h"
#include "../../lib/entities/artifact/CArtifact.h"
#include "../../lib/entities/artifact/CArtifactInstance.h"
#include "../../lib/mapObjects/CGHeroInstance.h"
#include "../../lib/spells/CSpellHandler.h"
#include "../../lib/spells/ISpellMechanics.h"
#include <optional>

inline void applyEraArtifactMassSpell(CGameHandler & handler,const CBattleInfoCallback & battle,
    const CGHeroInstance & hero,SpellID spell,BattleSide castingSide,std::optional<uint32_t> mainTarget)
{
    bool enabled=false;
    for(int slot=0;slot<19;++slot)
        if(const auto * artifact=hero.getArt(ArtifactPosition(slot)))
            if(era_compat::ArtifactPolicies::get().massSpell(artifact->getType()->getJsonKey(),spell.getNum())){enabled=true;break;}
    if(!enabled)return;
    const bool friendly=spell==SpellID::RESURRECTION || spell==SpellID::ANIMATE_DEAD;
    const auto * definition=spell.toSpell();
    const int mastery=hero.getSpellSchoolLevel(definition);
    const auto interference=era_compat::sourceInterferencePower(battle,&hero);
    const int power=::era_bridge::artifactMassSpellPower(interference?interference->effective:hero.getEffectPower(definition));
    // Source iterates the original side slots0..20, including surviving partial
    // stacks and excluding the primary target, dead stacks and arrow towers.
    // Read each slot again after preceding spells/rebirth state packets.
    const auto targetSide=friendly?castingSide:(castingSide==BattleSide::ATTACKER?BattleSide::DEFENDER:BattleSide::ATTACKER);
    for(int slot=0;slot<21;++slot)
    {
        const CStack * selected=nullptr;
        for(const auto * stack:battle.battleGetAllStacks(true))
            if(stack->unitSide()==targetSide && stack->sourceMassSlot()==slot){selected=stack;break;}
        if(!selected || !::era_bridge::artifactMassSpellTarget(selected->unitSide()==castingSide,friendly,
            mainTarget && selected->unitId()==*mainTarget,selected->alive(),
            selected->creatureId()==CreatureID::ARROW_TOWERS,selected->sourceMassSlot()))continue;
        spells::BattleCast cast(&battle,&hero,spells::Mode::PASSIVE,definition);
        cast.setSpellLevel(mastery);cast.setEffectPower(power);cast.massive=false;cast.smart=true;
        spells::Target target;target.emplace_back(selected);
        if(!definition->battleMechanics(&cast)->canBeCastAt(target))continue;
        // Native passive casts retain source immunity/eligibility and spell
        // animations while spending no additional mana, cast or charge.
        cast.cast(handler.spellcastEnvironment(),target);
        applyEraRebirth(handler,battle);
    }
}
