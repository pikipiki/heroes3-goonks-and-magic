/* Source ZCREXP row256 partial-block notification; no effect86 sprite implied. */
#pragma once
#include "../networkPacks/PacksForClientBattle.h"
#include "../texts/MetaString.h"
VCMI_LIB_NAMESPACE_BEGIN
inline BattleLogMessage eraDeflectionLog(BattleID battleID,int strength,int chance)
{
    BattleLogMessage result;result.battleID=battleID;
    MetaString line;line.appendTextID("tum-era.deflection.partialBlock");
    line.replaceNumber(strength);line.replaceNumber(chance);
    result.lines.push_back(line);return result;
}
VCMI_LIB_NAMESPACE_END
