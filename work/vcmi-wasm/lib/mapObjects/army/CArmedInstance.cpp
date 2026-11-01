/*
 * CArmedInstance.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */

#include "StdInc.h"
#include "CArmedInstance.h"
#include "../../era/EraCreatureArtifactMimic.h"
#include "../../era/EraUndeadArmyMoraleRuntime.h"
#include "../../bonuses/Propagators.h"
#include "../../bonuses/Limiters.h"
#include "../../bonuses/Updaters.h"

#include "CStackInstance.h"

#include "../../CPlayerState.h"
#include "../../entities/faction/CTown.h"
#include "../../entities/faction/CTownHandler.h"
#include "../../mapping/TerrainTile.h"
#include "../../GameLibrary.h"
#include "../../gameState/CGameState.h"

VCMI_LIB_NAMESPACE_BEGIN

void CArmedInstance::randomizeArmy(FactionID type)
{
	for(auto & elem : stacks)
	{
		if(elem.second->randomStack)
		{
			int level = elem.second->randomStack->level;
			int upgrade = elem.second->randomStack->upgrade;
			elem.second->setType((*LIBRARY->townh)[type]->town->creatures[level][upgrade]);

			elem.second->randomStack = std::nullopt;
		}
		assert(elem.second->valid(false));
		assert(elem.second->getArmy() == this);
	}
}

CArmedInstance::CArmedInstance(IGameInfoCallback * cb)
	: CArmedInstance(cb, BonusNodeType::ARMY, false)
{
}

CArmedInstance::CArmedInstance(IGameInfoCallback * cb, BonusNodeType nodeType, bool isHypothetic)
	: CGObjectInstance(cb)
	, CBonusSystemNode(nodeType, isHypothetic)
	, nonEvilAlignmentMix(this, Selector::type()(BonusType::NONEVIL_ALIGNMENT_MIX)) // Take Angelic Alliance troop-mixing freedom of non-evil units into account.
	, battle(nullptr)
{
}

void CArmedInstance::updateMoraleBonusFromArmy()
{
	if(!validTypes(false)) //object not randomized, don't bother
		return;

	auto b = getExportedBonusList().getFirst(Selector::sourceType()(BonusSource::ARMY).And(Selector::type()(BonusType::MORALE)));
	if(!b)
	{
		b = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::MORALE, BonusSource::ARMY, 0, BonusSourceID());
		addNewBonus(b);
	}

	//number of alignments and presence of undead
	std::set<FactionID> factions;
	bool hasUndead = false;

	for(const auto & slot : Slots())
	{
		const auto * creature = slot.second->getCreatureID().toEntity(LIBRARY);

		factions.insert(creature->getFactionID());
		// Check for undead flag instead of faction (undead mummies are neutral)
		if(!hasUndead)
		{
			//this is costly check, let's skip it at first undead
			hasUndead |= slot.second->hasBonusOfType(BonusType::UNDEAD);
		}
	}

	size_t factionsInArmy = factions.size(); //town garrison seems to take both sets into account

	if(nonEvilAlignmentMix.hasBonus() || era_compat::originalArmyMimicsArtifact(*this, 129))
	{
		size_t mixableFactions = 0;

		for(auto f : factions)
		{
			if(LIBRARY->factions()->getById(f)->getAlignment() != EAlignment::EVIL)
				mixableFactions++;
		}
		if(mixableFactions > 0)
			factionsInArmy -= mixableFactions - 1;
	}

	MetaString bonusDescription;

	if(factionsInArmy == 1)
	{
		b->val = +1;
		bonusDescription.appendTextID("core.arraytxt.115"); //All troops of one alignment +1
	}
	else if(!factions.empty()) // no bonus from empty garrison
	{
		b->val = 2 - static_cast<si32>(factionsInArmy);
		bonusDescription.appendTextID("core.arraytxt.114"); //Troops of %d alignments %d
		bonusDescription.replaceNumber(factionsInArmy);
	}

	b->description = bonusDescription;

	// Archer.erm:964-977 runs after the original Angel/Archangel +1.
	// Keep that native aura separate; source adds 2, minus 1 if Supreme is
	// present. Presence is boolean, so split Cherubs never add several auras.
	const auto sourceMorale = era_compat::originalArmyAngelicMorale(*this);
	auto sourceAura = getExportedBonusList().getFirst([](const Bonus * bonus)
	{
		return bonus->type == BonusType::MORALE && bonus->source == BonusSource::CREATURE_ABILITY
			&& bonus->stacking == "TUM.Archer.AngelicArmyMorale";
	});
	if(sourceMorale.value > 0)
	{
		if(!sourceAura)
		{
			sourceAura = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::MORALE,
				BonusSource::CREATURE_ABILITY, sourceMorale.value, BonusSourceID(sourceMorale.source));
			sourceAura->stacking = "TUM.Archer.AngelicArmyMorale";
			addNewBonus(sourceAura);
		}
		sourceAura->val = sourceMorale.value;
		sourceAura->sid = BonusSourceID(sourceMorale.source);
		sourceAura->description = MetaString();
		sourceAura->description.appendTextID(sourceMorale.source.toCreature()->getNameSingularTextID());
	}
	else if(sourceAura)
		removeBonus(sourceAura);

    // ArcherERM982..1010 reads the original seven-slot opposing army. Export
    // exactly one static family aura; summoned/cloned/dying battle stacks must
    // never acquire or remove this correction. Native creature family auras
    // are disabled by the accompanying scoped data overlay.
    const auto negativeMorale=era_compat::originalArmyUndeadMorale(*this);
    auto negativeAura=getExportedBonusList().getFirst([](const Bonus * bonus)
    {
        return bonus->type==BonusType::MORALE && bonus->source==BonusSource::CREATURE_ABILITY
            && bonus->stacking=="TUM.Archer.UndeadArmyMorale";
    });
    // OwnerUpdater produces a propagated COPY; remove/recreate instead of
    // editing an exported value that existing battle copies would not observe.
    if(negativeAura)
        removeBonus(negativeAura);
    if(negativeMorale.power>0)
    {
        negativeAura=std::make_shared<Bonus>(BonusDuration::PERMANENT,BonusType::MORALE,
            BonusSource::CREATURE_ABILITY,-negativeMorale.power,BonusSourceID(negativeMorale.source));
        negativeAura->stacking="TUM.Archer.UndeadArmyMorale";
        negativeAura->propagator=std::make_shared<CPropagatorNodeType>(BonusNodeType::BATTLE_WIDE);
        negativeAura->propagationUpdater=std::make_shared<OwnerUpdater>();
        negativeAura->addLimiter(std::make_shared<OppositeSideLimiter>());
        negativeAura->description.appendTextID(negativeMorale.source.toCreature()->getNameSingularTextID());
        addNewBonus(negativeAura);
    }

	nodeHasChanged();

	//-1 modifier for any Undead unit in army
	auto undeadModifier = getExportedBonusList().getFirst(Selector::source(BonusSource::ARMY, BonusCustomSource::undeadMoraleDebuff));
	if(hasUndead)
	{
		if(!undeadModifier)
		{
			undeadModifier = std::make_shared<Bonus>(BonusDuration::PERMANENT, BonusType::MORALE, BonusSource::ARMY, -1, BonusCustomSource::undeadMoraleDebuff);
			undeadModifier->description.appendTextID("core.arraytxt.116");
			addNewBonus(undeadModifier);
		}
	}
	else if(undeadModifier)
		removeBonus(undeadModifier);
}

void CArmedInstance::armyChanged()
{
	updateMoraleBonusFromArmy();
}

CBonusSystemNode & CArmedInstance::whereShouldBeAttached(CGameState & gs)
{
	if(tempOwner.isValidPlayer())
		if(auto * where = gs.getPlayerState(tempOwner))
			return *where;

	return gs.globalEffects;
}

CBonusSystemNode & CArmedInstance::whatShouldBeAttached()
{
	return *this;
}

void CArmedInstance::attachToBonusSystem(CGameState & gs)
{
	whatShouldBeAttached().attachTo(whereShouldBeAttached(gs));
}

void CArmedInstance::restoreBonusSystem(CGameState & gs)
{
	whatShouldBeAttached().attachTo(whereShouldBeAttached(gs));
	for(const auto & elem : stacks)
		elem.second->artDeserializationFix(gs, elem.second.get());
}

void CArmedInstance::detachFromBonusSystem(CGameState & gs)
{
	whatShouldBeAttached().detachFrom(whereShouldBeAttached(gs));
}

void CArmedInstance::attachUnitsToArmy()
{
	assert(getArmy() != nullptr);

	for(const auto & elem : stacks)
		elem.second->setArmy(getArmy());
}

const IBonusBearer * CArmedInstance::getBonusBearer() const
{
	return this;
}

void CArmedInstance::serializeJsonOptions(JsonSerializeFormat & handler)
{
	CGObjectInstance::serializeJsonOptions(handler);
	CCreatureSet::serializeJson(handler, "army", 7);
}

TerrainId CArmedInstance::getCurrentTerrain() const
{
	if(anchorPos().isValid())
		return cb->getTile(visitablePos())->getTerrainID();
	else
		return TerrainId::NONE;
}

VCMI_LIB_NAMESPACE_END
