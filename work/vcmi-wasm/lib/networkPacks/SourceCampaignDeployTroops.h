/* Player request for the original leave-creatures action. */
#pragma once
#include "NetPacksBase.h"
#include "../int3.h"
VCMI_LIB_NAMESPACE_BEGIN
struct DLL_LINKAGE SourceCampaignDeployTroops : public CPackForServer
{
 ObjectInstanceID hero;
 SlotID slot;
 CreatureID creature;
 int32_t count=0;
 int3 position;
 bool takeBack=false;
 void visitTyped(ICPackVisitor & visitor) override;
 template<typename Handler>void serialize(Handler & h)
 {h & static_cast<CPackForServer &>(*this);h & hero;h & slot;h & creature;h & count;h & position;h & takeBack;}
};
VCMI_LIB_NAMESPACE_END
