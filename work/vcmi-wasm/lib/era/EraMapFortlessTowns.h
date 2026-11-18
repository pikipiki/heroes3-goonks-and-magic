#pragma once
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"
#include "../json/JsonNode.h"
#include "../mapObjects/CGTownInstance.h"

namespace era_compat::map_rules
{
inline void applyInitialFortifications(CGameState & game,const JsonNode & next)
{
    if(!next["fortlessApplied"].Bool()||game.getMap().eraGameplayState["mapRules"]["fortlessApplied"].Bool())return;
    for(const auto & row:next["fortlessTowns"].Vector())
    {
        auto * town=dynamic_cast<CGTownInstance *>(game.getObjInstance(ObjectInstanceID(row.Integer())));
        if(!town)throw std::runtime_error("Invalid WoG initial fortification target");
        // Source CA:B2/9 B2/8 B2/7 leaves no Castle, Citadel or Fort.
        // It does not spend resources or a construction/demolition action.
        town->removeBuilding(BuildingID::CASTLE);
        town->removeBuilding(BuildingID::CITADEL);
        town->removeBuilding(BuildingID::FORT);
        town->updateAppearance();
        town->recreateBuildingsBonuses();
    }
}
}
