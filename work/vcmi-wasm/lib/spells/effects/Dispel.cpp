/*
 * Dispel.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "../../era/EraDragonFly241DispelScope.h"
#include "../../era/EraWeakness45State.h"
#include "../../era/EraXpTimed184Hooks.h"

#include "Dispel.h"
#include "../../era/EraSourceRankRange.h"
#include "Registry.h"

#include <vcmi/spells/Spell.h>

#include "../ISpellMechanics.h"

#include "../../battle/IBattleState.h"
#include "../../battle/CBattleInfoCallback.h"
#include "../../battle/Unit.h"
#include "../../bonuses/BonusList.h"
#include "../../networkPacks/PacksForClientBattle.h"
#include "../../networkPacks/SetStackEffect.h"
#include "../../serializer/JsonSerializeFormat.h"

VCMI_LIB_NAMESPACE_BEGIN

namespace spells
{
namespace effects
{

void Dispel::apply(ServerCallback * server, const Mechanics * m, const EffectTarget & target) const
{
	const bool describe = server->describeChanges();
	SetStackEffect sse;
	BattleLogMessage blm;
	blm.battleID = m->battle()->getBattle()->getBattleID();
	sse.battleID = m->battle()->getBattle()->getBattleID();

	for(const auto & t : target)
	{
		const battle::Unit * unit = t.unitValue;
		if(unit)
		{
			//special case for DISPEL_HELPFUL_SPELLS
			if(describe && positive && !negative && !neutral)
			{
				MetaString line;
				unit->addText(line, EMetaText::GENERAL_TXT, -555, true);
				unit->addNameReplacement(line, true);
				blm.lines.push_back(std::move(line));
			}

			std::vector<Bonus> buffer;
			auto bl = getBonuses(m, unit);

			std::set<int> typedHandled;
            for(const auto& item : *bl)
            {
                if(era_compat::sourceTimedOwnedTag(item->stacking))
                {
                    const int id=item->sid.as<SpellID>().getNum();
                    if(typedHandled.insert(id).second)era_compat::consumeNativeXpTimed184Dispel(server,*m,*unit,id,positive,negative,neutral);
                    continue;
                }
                buffer.emplace_back(*item);
            }
            // Only a successfully selected source45 UI effect triggers its
            // lifecycle. Native Dispel immunity/selection has already run.
            if(std::any_of(bl->begin(),bl->end(),[](const auto & b){return b->stacking==era_compat::weakness45VisibleTag;}))
            {
                if(const auto source=era_compat::sourceWeakness45RemovalPacket(sse.battleID,unit))
                {
                    sse.toRemove.insert(sse.toRemove.end(),source->toRemove.begin(),source->toRemove.end());
                    sse.toAdd.insert(sse.toAdd.end(),source->toAdd.begin(),source->toAdd.end());
                }
            }

			if(!buffer.empty())
				sse.toRemove.emplace_back(unit->unitId(), buffer);
		}
	}

	if(!sse.toRemove.empty())
		server->apply(sse);

	if(describe && !blm.lines.empty())
		server->apply(blm);
}

bool Dispel::isValidTarget(const Mechanics * m, const battle::Unit * unit) const
{
	if(getBonuses(m, unit)->empty())
		return false;

	return UnitEffect::isValidTarget(m, unit);
}

void Dispel::serializeJsonUnitEffect(JsonSerializeFormat & handler)
{
	handler.serializeBool("dispelPositive", positive);
	handler.serializeBool("dispelNegative", negative);
	handler.serializeBool("dispelNeutral", neutral);
}

std::shared_ptr<const BonusList> Dispel::getBonuses(const Mechanics * m, const battle::Unit * unit) const
{
	// Original WoG71E9B3..71EA91: only regular Dispel35; Hypnotize flips control.
	for(const auto & immunity : *unit->getBonusesOfType(BonusType::ERA_DISPEL_IMMUNITY))
		if(::era_bridge::sourceDispelImmune(immunity->val, m->ownerMatches(unit, true), unit->isHypnotized(), m->getSpellIndex()))
			return std::make_shared<BonusList>();

	auto sel = [this, m, unit](const Bonus * bonus)
	{
		if(bonus->source == BonusSource::SPELL_EFFECT)
		{
            if(era_compat::DragonFly241DispelCustomScope::applies(m->getSpellIndex(),m->caster,unit)
                &&!era_compat::dragonFly241CustomPositiveSpell(bonus->sid.as<SpellID>().num))return false;
			const Spell * sourceSpell = bonus->sid.as<SpellID>().toEntity(m->spells());
			if(!sourceSpell)
				return false;//error

			//Spells that can't be dispelled
			if(sourceSpell->isPersistent())
				return false;
			//stack may have inherited effects
			if(sourceSpell->isAdventure())
				return false;
			//Don't remove bonuses that may have been added by this very spell
			if(sourceSpell->getIndex() == m->getSpellIndex())
				return false;

			auto positiveness = sourceSpell->getPositiveness();

			if(boost::logic::indeterminate(positiveness))
			{
				if(neutral)
					return true;
			}
			else if(positiveness)
			{
				if(positive)
					return true;
			}
			else
			{
				if(negative)
					return true;
			}
		}
		return false;
	};
	CSelector selector(sel);

	return unit->getBonuses(selector);
}

}
}

VCMI_LIB_NAMESPACE_END
