/*
 * Damage.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "../../era/EraDeflectionLog.h"

#include "Damage.h"
#include "Registry.h"
#include "../CSpellHandler.h"
#include "../ISpellMechanics.h"

#include "../../CStack.h"
#include "../../CCreatureHandler.h"
#include "../../era/EraBridgePolicies.h"
#include "../../era/EraDeflectionRuntime.h"
#include "../../networkPacks/SetStackEffect.h"
#include "../../battle/IBattleState.h"
#include "../../battle/CBattleInfoCallback.h"
#include "../../networkPacks/PacksForClientBattle.h"
#include "../../texts/CGeneralTextHandler.h"
#include "../../texts/Languages.h"
#include "../../serializer/JsonSerializeFormat.h"
#include "../lib/CRandomGenerator.h"

#include <vcmi/spells/Spell.h>


VCMI_LIB_NAMESPACE_BEGIN

namespace spells
{
namespace effects
{

namespace
{
bool eraDeflectionSpell(const Mechanics * m)
{
    // Shipped source hook records789A88..789B20 include5A1065 (DeathRipple)
    // and469A93 (ordinary faction moat), but NOT MagicArrow5A0D02 or other
    // direct damage spell calls. Do not apply globally to every Damage effect.
    const auto spell = m->getSpellId();
    if(spell == SpellID(SpellID::DEATH_RIPPLE) || spell == SpellID(SpellID::THUNDERBOLT)
        || spell == SpellID(SpellID::DEATH_STARE) || spell == SpellID(SpellID::ACID_BREATH_DAMAGE)) return true;
    const auto key = m->getSpell()->getJsonKey();
    static const std::set<std::string> sourceMoats = {"core:castleMoatTrigger", "core:rampartMoatTrigger",
        "core:infernoMoatTrigger", "core:necropolisMoatTrigger", "core:dungeonMoatTrigger",
        "core:strongholdMoatTrigger", "core:fortressMoatTrigger", "core:confluxMoatTrigger"};
    return sourceMoats.count(key) != 0;
}
}

void Damage::apply(ServerCallback * server, const Mechanics * m, const EffectTarget & target) const
{
	StacksInjured stacksInjured;
    SetStackEffect clearedStatuses;
    clearedStatuses.battleID = m->battle()->getBattle()->getBattleID();
	BattleLogMessage blm;
	stacksInjured.battleID = m->battle()->getBattle()->getBattleID();
	blm.battleID = m->battle()->getBattle()->getBattleID();

	size_t targetIndex = 0;
	const battle::Unit * firstTarget = nullptr;
	const bool describe = server->describeChanges();

	int64_t damageToDisplay = 0;
	uint32_t killed = 0;
	bool multiple = false;

	for(const auto & t : target)
	{
		const battle::Unit * unit = t.unitValue;
		if(unit && unit->alive())
		{
			BattleStackAttacked bsa;
			bsa.damageAmount = damageForTarget(targetIndex, m, unit);
            if(eraDeflectionSpell(m))
                bsa.damageAmount = applyEraDeflection(m->battle()->battleGetStackByID(unit->unitId()),
                    *server->getRNG(), bsa.damageAmount, [&](int strength,int chance){if(!describe)return;auto message=eraDeflectionLog(m->battle()->getBattle()->getBattleID(),strength,chance);server->apply(message);});
			bsa.stackAttacked = unit->unitId();
			bsa.attackerID = -1;
			auto newState = unit->acquireState();
			CStack::prepareAttacked(bsa, *server->getRNG(), newState);
            if(bsa.damageAmount < 0 && era_compat::Policies::get().spellDamageInversion(
                unit->creatureId().toCreature()->getJsonKey()))
            {
                // Original443E1B clears Blind62, Stone70 and Paralyze74 even
                // when signed damage is negative. A positive healthDelta would
                // otherwise bypass native UntilBeingAttacked removal.
                std::vector<Bonus> removed;
                for(const auto & bonus : *unit->getBonuses(Selector::sourceTypeSel(BonusSource::SPELL_EFFECT)))
                {
                    const auto source = bonus->sid.as<SpellID>();
                    if(source == SpellID(SpellID::BLIND) || source == SpellID(SpellID::STONE_GAZE)
                        || source == SpellID(SpellID::PARALYZE))
                        removed.push_back(*bonus);
                }
                if(!removed.empty())
                    clearedStatuses.toRemove.emplace_back(unit->unitId(), std::move(removed));
            }


			if(describe)
			{
				if(!firstTarget)
					firstTarget = unit;
				else
					multiple = true;
				damageToDisplay += bsa.damageAmount;
				killed += bsa.killedAmount;
			}
			stacksInjured.stacks.push_back(bsa);
		}
		targetIndex++;
	}

	if(describe && firstTarget && damageToDisplay > 0)
	{
		describeEffect(blm.lines, m, firstTarget, killed, damageToDisplay, multiple);
	}

	if(!stacksInjured.stacks.empty())
		server->apply(stacksInjured);

    if(!clearedStatuses.toRemove.empty())
        server->apply(clearedStatuses);

	if(!blm.lines.empty())
		server->apply(blm);
}

SpellEffectValue Damage::getHealthChange(const Mechanics * m, const EffectTarget & spellTarget) const
{
	SpellEffectValue result {};

	size_t targetIndex = 0;
	CRandomGenerator fakeRng;

	for(auto const & t : spellTarget)
	{
		const battle::Unit * unit = t.unitValue;
		if(unit && unit->alive())
		{
			BattleStackAttacked bsa;
			bsa.damageAmount = damageForTarget(targetIndex, m, unit);
            if(eraDeflectionSpell(m))
                bsa.damageAmount = applyEraDeflection(m->battle()->battleGetStackByID(unit->unitId()),
                    fakeRng, bsa.damageAmount);
			bsa.stackAttacked = unit->unitId();
			bsa.attackerID = -1;
			auto state = unit->acquireState();
			int64_t before = state->getAvailableHealth();
			CStack::prepareAttacked(bsa, fakeRng, state);
			int64_t after  = state->getAvailableHealth();
			int64_t applied = before - after;

			result.hpDelta -= applied;
            if(bsa.damageAmount < 0 && era_compat::Policies::get().spellDamageInversion(
                unit->creatureId().toCreature()->getJsonKey()))
                result.unitsDelta += state->getCount() - unit->getCount();
            else
                result.unitsDelta -= static_cast<int32_t>(bsa.killedAmount);
		}

		targetIndex++;
	}

	return result;
}

bool Damage::isReceptive(const Mechanics * m, const battle::Unit * unit) const
{
	if(!UnitEffect::isReceptive(m, unit))
		return false;

	bool isImmune = m->getSpell()->isMagical() && (unit->getBonusBearer()->valOfBonuses(BonusType::SPELL_DAMAGE_REDUCTION, BonusSubtypeID(SpellSchool::ANY)) >= 100); //General spell damage immunity
	//elemental immunity for damage
	m->getSpell()->forEachSchool([&](const SpellSchool & cnf, bool & stop)
	{
		isImmune |= (unit->getBonusBearer()->valOfBonuses(BonusType::SPELL_DAMAGE_REDUCTION, BonusSubtypeID(cnf)) >= 100); //100% reduction is immunity
	});

	return !isImmune;
}

void Damage::serializeJsonUnitEffect(JsonSerializeFormat & handler)
{
	handler.serializeBool("killByPercentage", killByPercentage);
	handler.serializeBool("killByCount", killByCount);
}

int64_t Damage::damageForTarget(size_t targetIndex, const Mechanics * m, const battle::Unit * target) const
{
	int64_t baseDamage;

	if(killByPercentage)
	{
		int64_t amountToKill = target->getCount() * m->getEffectValue() / 100;
		baseDamage = amountToKill * target->getMaxHealth();
	}
	else if(killByCount)
	{
		baseDamage = m->getEffectValue() * target->getMaxHealth();
	}
	else
	{
		baseDamage = m->adjustEffectValue(target);
	}

	if(chainLength > 1 && targetIndex > 0)
	{
		double indexedFactor = std::pow(chainFactor, static_cast<double>(targetIndex));
		return static_cast<int64_t>(indexedFactor * baseDamage);
	}

	return baseDamage;
}

void Damage::describeEffect(std::vector<MetaString> & log, const Mechanics * m, const battle::Unit * firstTarget, uint32_t kills, int64_t damage, bool multiple) const
{
	if(m->getSpellIndex() == SpellID::DEATH_STARE && !multiple)
	{
		MetaString line;
		if(kills > 1)
		{
			line.appendLocalString(EMetaText::GENERAL_TXT, 119); //%d %s die under the terrible gaze of the %s.
			line.replaceNumber(kills);
			firstTarget->addNameReplacement(line, true);
		}
		else
		{
			line.appendLocalString(EMetaText::GENERAL_TXT, 118); //One %s dies under the terrible gaze of the %s.
			firstTarget->addNameReplacement(line, false);
		}
		m->caster->getCasterName(line);
		log.push_back(line);
	}
	else if(m->getSpell()->getJsonKey().find("accurateShot") != std::string::npos && !multiple)
	{
		MetaString line;
		std::string preferredLanguage = LIBRARY->generaltexth->getPreferredLanguage();
		std::string textID = "vcmi.battleWindow.accurateShot.resultDescription";
		line.appendTextID(Languages::getPluralFormTextID( preferredLanguage, kills, textID));
		line.replaceNumber(kills);
		firstTarget->addNameReplacement(line, kills != 1);
		log.push_back(line);
	}
	else if(m->getSpellIndex() == SpellID::THUNDERBOLT && !multiple)
	{
		{
			MetaString line;
			firstTarget->addText(line, EMetaText::GENERAL_TXT, -367, true);
			firstTarget->addNameReplacement(line, true);
			log.push_back(line);
		}

		{
			MetaString line;
			//todo: handle newlines in metastring
			std::string text = LIBRARY->generaltexth->allTexts[343]; //Does %d points of damage.
			boost::algorithm::trim(text);
			line.appendRawString(text);
			line.replaceNumber(static_cast<int>(damage)); //no more text afterwards
			log.push_back(line);
		}
	}
	else
	{
		{
			MetaString line;
			line.appendLocalString(EMetaText::GENERAL_TXT, 376); // Spell %s does %d damage
			line.replaceName(m->getSpellId());
			line.replaceNumber(static_cast<int>(damage));

			log.push_back(line);
		}

		if (kills > 0)
		{
			MetaString line;

			if(kills > 1)
			{
				line.appendLocalString(EMetaText::GENERAL_TXT, 379); // %d %s perishes
				line.replaceNumber(kills);

				if(multiple)
					line.replaceLocalString(EMetaText::GENERAL_TXT, 43); // creatures
				else
					firstTarget->addNameReplacement(line, true);
			}
			else // single creature killed
			{
				line.appendLocalString(EMetaText::GENERAL_TXT, 378); // one %s perishes
				if(multiple)
					line.replaceLocalString(EMetaText::GENERAL_TXT, 42); // creature
				else
					firstTarget->addNameReplacement(line, false);
			}

			log.push_back(line);
		}
	}
}

}
}

VCMI_LIB_NAMESPACE_END
