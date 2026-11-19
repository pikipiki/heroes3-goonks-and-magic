#pragma once
#include "NetPacksBase.h"
#include "../json/JsonNode.h"
#include "../mapObjects/army/CArmedInstance.h"
VCMI_LIB_NAMESPACE_BEGIN
struct DLL_LINKAGE EraGameplayChange : public CPackForClient
{
    std::string system;
    JsonNode state;
    void visitTyped(ICPackVisitor & visitor) override;
    template<class Handler> void serialize(Handler & h){h & system;h & state;}
};
/// Exactly one of army (create) or removedArmy (release) is supplied. An army
/// reserves an ID but never enters tiles, map object scans or visit dispatch.
struct DLL_LINKAGE TemporaryBattleArmyChange : public CPackForClient
{
    std::shared_ptr<CArmedInstance> army;
    ObjectInstanceID removedArmy = ObjectInstanceID::NONE;
    void visitTyped(ICPackVisitor & visitor) override;
    template<class Handler> void serialize(Handler & h){h & army;h & removedArmy;}
};
// Original resource writes preserve their signed32 word. Native SetResources
// applies a cap and positivity pass to the entire resource set instead.
struct DLL_LINKAGE EraResourceWordChange : public CPackForClient
{
    PlayerColor player = PlayerColor::NEUTRAL;
    GameResID resource = GameResID::GOLD;
    int32_t amount = 0;
    void visitTyped(ICPackVisitor & visitor) override;
    template<class Handler> void serialize(Handler & h){h & player;h & resource;h & amount;}
};
struct DLL_LINKAGE MithrilAction : public CPackForServer
{
    ObjectInstanceID object;
    int32_t choice=0;
    uint32_t revision=0;
    void visitTyped(ICPackVisitor & visitor) override;
    template<class Handler> void serialize(Handler & h)
    {h & static_cast<CPackForServer &>(*this);h & object;h & choice;h & revision;}
};
VCMI_LIB_NAMESPACE_END
