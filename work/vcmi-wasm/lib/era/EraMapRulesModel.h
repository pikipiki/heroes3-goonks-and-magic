#pragma once
#include "../callback/IGameInfoCallback.h"
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"

namespace era_compat::map_rules
{
inline const JsonNode & state(const IGameInfoCallback & cb)
{return cb.gameState().getMap().eraGameplayState["mapRules"];}
inline bool weeklyMines(const IGameInfoCallback & cb)
{return state(cb)["rules"]["122"].Bool();}
inline bool dailyPlains(const IGameInfoCallback & cb)
{return state(cb)["rules"]["114"].Bool();}
inline bool multipleCapitols(const IGameInfoCallback & cb)
{return state(cb)["rules"]["124"].Bool();}
}
