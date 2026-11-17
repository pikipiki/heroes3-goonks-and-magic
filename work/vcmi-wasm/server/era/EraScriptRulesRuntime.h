#pragma once
#include "../CGameHandler.h"
#include "../../lib/era/EraScriptRulesModel.h"
#include "../../lib/filesystem/Filesystem.h"
#include "../../lib/networkPacks/EraGameplayPacks.h"
namespace era_compat::script_rules
{
inline void initializeSettings(CGameHandler & gh,bool firstTurn)
{
 if(!state(gh.gameInfo()).isNull()){validate(state(gh.gameInfo()));return;}
 JsonNode configured;
 const auto path=JsonPath::builtin("config/era-script-rules");
 // Only a new game's settings may seed a rule. Missing old-save state stays
 // disabled, regardless of which resources are installed when it is reloaded.
 if(firstTurn&&CResourceHandler::get()->existsResource(path))configured=JsonNode(path)["eraScripts"];
 auto snapshot=initialSnapshot(state(gh.gameInfo()),configured,firstTurn);
 EraGameplayChange packet;packet.system="eraScripts";packet.state=std::move(snapshot);gh.sendAndApply(packet);
}
}
