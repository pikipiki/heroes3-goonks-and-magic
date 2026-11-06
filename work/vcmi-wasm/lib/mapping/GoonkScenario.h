/*
 * GoonkScenario.h, part of VCMI engine
 * License: GNU General Public License v2.0 or later
 */
#pragma once

#include "CMapHeader.h"
#include "../filesystem/ResourcePath.h"

VCMI_LIB_NAMESPACE_BEGIN

inline bool isGoonkShowcaseMap(const ResourcePath & file)
{
	const auto & name = file.getName();
	return name == "MAPS/000-GOONK" || name == "MAPS/001-GOONKS" || name == "MAPS/002-GOONKS-ONLINE";
}

inline bool allowsCastleChoice(const PlayerInfo & player)
{
	return player.hasMainTown && player.allowedFactions.size() > 1;
}

VCMI_LIB_NAMESPACE_END
