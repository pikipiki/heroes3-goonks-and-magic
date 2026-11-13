/*
 * AutocombatPreferences.h, part of VCMI engine
 *
 * Authors: listed in file AUTHORS in main folder
 *
 * License: GNU General Public License v2.0 or later
 * Full text of license available in license.txt file, in main folder
 *
 */
#pragma once

struct AutocombatPreferences
{
	bool enableSpellsUsage = true;
	// Zero keeps the full native search. Web allied autocombat must also leave
	// room for input when a cheat-granted spellbook contains every spell.
	unsigned spellEvaluationTimeBudgetMs = 0;
	//TODO: below options exist in original H3, consider usefulness of mixed human-AI combat when enabling autocombat inside battle
//	bool enableUnitsUsage = true;
//	bool enableCatapultUsage = true;
//	bool enableBallistaUsage = true;
//	bool enableFirstAidTendUsage = true;
};

