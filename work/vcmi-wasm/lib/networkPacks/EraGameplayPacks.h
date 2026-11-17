#pragma once
#include "NetPacksBase.h"
#include "../json/JsonNode.h"
VCMI_LIB_NAMESPACE_BEGIN
struct DLL_LINKAGE EraGameplayChange : public CPackForClient
{
    std::string system;
    JsonNode state;
    void visitTyped(ICPackVisitor & visitor) override;
    template<class Handler> void serialize(Handler & h){h & system;h & state;}
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
