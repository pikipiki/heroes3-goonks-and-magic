#pragma once
#include "NetPacksBase.h"
VCMI_LIB_NAMESPACE_BEGIN
struct DLL_LINKAGE HenchmanChange : public CPackForClient
{
    ObjectInstanceID hero;
    CreatureID creature;
    int32_t experience=0;
    int64_t stackExperience=0;
    bool alive=false,declined=false;
    int32_t banner=-1;
    uint32_t revision=0;
    SlotID returnedSlot;
    int64_t returnedExperience=-1;
    void visitTyped(ICPackVisitor & visitor) override;
    template<typename Handler> void serialize(Handler & h)
    {h & hero;h & creature;h & experience;h & stackExperience;h & alive;h & declined;h & banner;h & revision;h & returnedSlot;h & returnedExperience;}
};
struct DLL_LINKAGE HenchmanAction : public CPackForServer
{
    enum Operation : int32_t { SELECT=0, DISMISS=1, RESURRECT=2,
        EQUIP_BANNER=3, SET_BANNER_STYLE=4, RETURN_BANNER=5 };
    ObjectInstanceID hero;
    int32_t operation=SELECT,slot=-1;
    CreatureID expectedCreature;
    uint32_t revision=0;
    void visitTyped(ICPackVisitor & visitor) override;
    template<typename Handler> void serialize(Handler & h)
    {h & static_cast<CPackForServer &>(*this);h & hero;h & operation;h & slot;h & expectedCreature;h & revision;}
};
VCMI_LIB_NAMESPACE_END
