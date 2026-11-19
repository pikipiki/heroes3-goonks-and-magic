/*
 * UpgradeInfo.cpp, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#include "StdInc.h"
#include "UpgradeInfo.h"
#include "CCreatureHandler.h"
#include "../era/EraCreaturePrices.h"
#include "../era/EraCreaturePriceRules.h"

VCMI_LIB_NAMESPACE_BEGIN

void UpgradeInfo::addUpgrade(const CreatureID & upgradeID, const Creature * creature, int costPercentageModifier, const IGameInfoCallback * cb, bool sourceFort)
{
	isAvailable = costPercentageModifier >= 0;

	upgradesIDs.push_back(upgradeID);

	ResourceSet delta = era_compat::creature_prices::get(cb, *upgradeID.toCreature()) - era_compat::creature_prices::get(cb, *creature);
	delta.positive();
	originalDeltas.push_back(delta);
	originalFortPercent.push_back(sourceFort ? costPercentageModifier : -1);
	ResourceSet upgradeCost = delta * costPercentageModifier / 100;
	upgradeCost.positive(); //upgrade cost can't be negative, ignore missing resources
	upgradesCosts.push_back(std::move(upgradeCost));

	// sort from highest ID to smallest
	size_t pos = upgradesIDs.size() - 1;
	while(pos > 0 && upgradesIDs[pos] > upgradesIDs[pos - 1])
	{
		std::swap(upgradesIDs[pos], upgradesIDs[pos - 1]);
		std::swap(upgradesCosts[pos], upgradesCosts[pos - 1]);
		std::swap(originalDeltas[pos], originalDeltas[pos - 1]);
		std::swap(originalFortPercent[pos], originalFortPercent[pos - 1]);
		--pos;
	}
}

ResourceSet UpgradeInfo::getUpgradeTotalCostsFor(CreatureID id, int count) const
{
    const auto it = std::find(upgradesIDs.begin(), upgradesIDs.end(), id);
    assert(it != upgradesIDs.end());
    const auto index = std::distance(upgradesIDs.begin(), it);
    const int percent = originalFortPercent[index];
    if(percent < 0) return upgradesCosts[index] * count;
    ResourceSet result;
    if(percent == 0) return result;
    for(size_t resource = 0; resource < result.size(); ++resource)
        result[resource] = era_bridge::creature_prices::signedWord(static_cast<uint32_t>(originalDeltas[index][resource]) * static_cast<uint32_t>(count));
    result[GameResID::GOLD] = era_bridge::creature_prices::fortGold(result[GameResID::GOLD], percent);
    return result;
}

VCMI_LIB_NAMESPACE_END
