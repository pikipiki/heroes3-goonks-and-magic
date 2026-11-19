/*
 * ExtraOptionsInfo.h, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */

#pragma once

#include <array>
#include <cstdint>
#include <stdexcept>
#include <vector>
#include "era/EraWogOptions.h"

VCMI_LIB_NAMESPACE_BEGIN

struct DLL_LINKAGE ExtraOptionsInfo
{
	bool cheatsAllowed = true;
	bool unlimitedReplay = false;
	// Each choice inherits the authored map unless explicitly set to0 or1.
	std::array<int8_t, era_bridge::wogOptionCount> wogOptions = era_bridge::defaultWogChoices();

	bool operator == (const ExtraOptionsInfo & other) const;

	template <typename Handler>
	void serialize(Handler &h)
	{
		h & cheatsAllowed;
		h & unlimitedReplay;
		if(h.hasFeature(Handler::Version::GOONK_WOG_OPTIONS))
		{
			// Fixed layouts remain exact for historical save and packet versions.
			const auto fixed=[&](auto & values)
			{
				if(h.saving)std::copy_n(wogOptions.begin(),values.size(),values.begin());
				h & values;
				if(!h.saving)
				{
					wogOptions.fill(-1);
					std::copy(values.begin(),values.end(),wogOptions.begin());
				}
			};
			if(h.hasFeature(Handler::Version::GOONK_WOG_OPTION_CATALOGUE))
			{
				// Length-prefixed choices let the catalogue grow without changing
				// the byte boundaries of every earlier choice count.
				const auto supported=h.hasFeature(Handler::Version::GOONK_WOG_EIGHTH_UPGRADES)?era_bridge::wogOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_HALF_PRICES)?era_bridge::wogHalfPricesOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_DOUBLE_ARTIFACTS)?era_bridge::wogDoubleArtifactsOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_FORTLESS_TOWNS)?era_bridge::wogFortlessOptionCount:
					h.hasFeature(Handler::Version::GOONK_MITHRIL_DISPLAY)?era_bridge::wogDisplayMithrilOptionCount:
					h.hasFeature(Handler::Version::GOONK_MITHRIL_RESOURCE_REPLACEMENT)?era_bridge::wogReplacementMithrilOptionCount:
					h.hasFeature(Handler::Version::GOONK_MITHRIL_WEEKLY_SITES)?era_bridge::wogWeeklyMithrilOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_INVERTED_SPEEDS)?era_bridge::wogInvertedSpeedsOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_GROUNDED_FLIERS)?era_bridge::wogGroundedFliersOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_EXTRA_DWELLING_CREATURES)?era_bridge::wogExtraDwellingOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_MONTHLY_VISITS)?era_bridge::wogMonthlyVisitsOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_TOWN_GRAILS)?era_bridge::wogTownGrailsOptionCount:
					h.hasFeature(Handler::Version::GOONK_WOG_ARMY_GROWTH)?era_bridge::wogArmyGrowthOptionCount:
					era_bridge::wogMapRuleOptionCount;
				std::vector<int8_t> choices;
				if(h.saving)choices.assign(wogOptions.begin(),wogOptions.begin()+supported);
				h & choices;
				if(choices.size()>supported)throw std::runtime_error("Unknown WoG game option");
				if(!h.saving)
				{
					wogOptions.fill(-1);
					std::copy(choices.begin(),choices.end(),wogOptions.begin());
				}
			}
			else if(h.hasFeature(Handler::Version::GOONK_WOG_OPTIONS_EXTENDED))
			{
				std::array<int8_t,era_bridge::wogMithrilOptionCount> values;
				fixed(values);
			}
			else
			{
				std::array<int8_t,era_bridge::wogLegacyOptionCount> values;
				fixed(values);
			}
			for(const auto choice : wogOptions)
				if(choice < -1 || choice > 1)
					throw std::runtime_error("Invalid WoG game option");
		}
		else if(!h.saving)
			wogOptions.fill(-1);
	}
};

VCMI_LIB_NAMESPACE_END
