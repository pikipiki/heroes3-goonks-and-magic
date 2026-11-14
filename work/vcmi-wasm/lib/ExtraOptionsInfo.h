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
#include "era/EraWogOptions.h"

VCMI_LIB_NAMESPACE_BEGIN

struct DLL_LINKAGE ExtraOptionsInfo
{
	bool cheatsAllowed = true;
	bool unlimitedReplay = false;
	// Each choice inherits the authored map unless explicitly set to0 or1.
	std::array<int8_t, era_bridge::wogOptionCount> wogOptions{{-1, -1, -1, -1, -1, -1}};

	bool operator == (const ExtraOptionsInfo & other) const;

	template <typename Handler>
	void serialize(Handler &h)
	{
		h & cheatsAllowed;
		h & unlimitedReplay;
		if(h.hasFeature(Handler::Version::GOONK_WOG_OPTIONS))
		{
			h & wogOptions;
			for(const auto choice : wogOptions)
				if(choice < -1 || choice > 1)
					throw std::runtime_error("Invalid WoG game option");
		}
		else if(!h.saving)
			wogOptions.fill(-1);
	}
};

VCMI_LIB_NAMESPACE_END
