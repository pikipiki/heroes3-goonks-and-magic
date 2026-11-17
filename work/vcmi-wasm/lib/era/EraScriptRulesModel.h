/* Frozen per-game ERA Scripts rules. Does not admit an entire gameplay profile. */
#pragma once
#include "../callback/IGameInfoCallback.h"
#include "../gameState/CGameState.h"
#include "../mapping/CMap.h"
#include <stdexcept>
namespace era_compat::script_rules
{
inline void validate(const JsonNode & node)
{
 if(!node.isStruct()||!node["schemaVersion"].isNumber()||node["schemaVersion"].Float()!=1||!node["profile"].isString()||!node["rules"].isStruct())
  throw std::runtime_error("Invalid frozen ERA Scripts rules");
 const auto & profile=node["profile"].String();
 if(profile!="none"&&profile!="era-scripts"&&profile!="advanced-classes"&&profile!="reborn")
  throw std::runtime_error("Unknown ERA Scripts source profile");
 if(!node["rules"]["779"].isBool())throw std::runtime_error("Missing ERA779 frozen choice");
 for(const auto & entry:node["rules"].Struct())if(entry.first!="779")throw std::runtime_error("Unbound ERA Scripts option in snapshot");
 if(profile=="none"&&node["rules"]["779"].Bool())throw std::runtime_error("ERA779 needs a source profile context");
}
inline JsonNode disabledSnapshot()
{
 JsonNode node;node["schemaVersion"].Integer()=1;node["profile"].String()="none";node["rules"]["779"].Bool()=false;return node;
}
inline JsonNode initialSnapshot(const JsonNode & saved,const JsonNode & configured,bool firstTurn)
{
 if(!saved.isNull()){validate(saved);return saved;}
 auto result=firstTurn&&!configured.isNull()?configured:disabledSnapshot();validate(result);return result;
}
inline const JsonNode & state(const IGameInfoCallback & cb)
{return cb.gameState().getMap().eraGameplayState["eraScripts"];}
inline bool learningStones(const IGameInfoCallback & cb)
{
 const auto & saved=state(cb);if(saved.isNull())return false;
 validate(saved);return saved["rules"]["779"].Bool();
}
}
