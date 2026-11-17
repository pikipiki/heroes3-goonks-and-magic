/* Persistent hero-owned Henchman state, separate from commanders. GPL-2.0-or-later. */
#pragma once
#include "../mapObjects/army/CStackInstance.h"

VCMI_LIB_NAMESPACE_BEGIN
struct HenchmanState
{
    std::unique_ptr<CStackInstance> stack;
    int32_t experience=0;
    bool alive=false;
    bool declined=false;
    int32_t banner=-1;
    uint32_t revision=0;
    // Derived only while constructing a new campaign map. Ordinary saves
    // already contain their frozen rules, so this is not a serialized field.
    bool importedFromCampaign=false;
    template<typename Handler> void serialize(Handler & h)
    {
        h & stack;h & experience;h & alive;h & declined;h & banner;h & revision;
    }
};
VCMI_LIB_NAMESPACE_END
