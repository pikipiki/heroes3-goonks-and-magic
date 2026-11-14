/* Replicated native state for the source-bound WoG campaign programs. */
#pragma once
#include "NetPacksBase.h"
#include "../json/JsonNode.h"
#include "../rewardable/Configuration.h"
VCMI_LIB_NAMESPACE_BEGIN
struct DLL_LINKAGE SourceCampaignChange : public CPackForClient
{
    JsonNode state;
    JsonNode changes;
    std::map<ObjectInstanceID, Rewardable::Configuration> rewardConfigurations;
    void visitTyped(ICPackVisitor & visitor) override;
    template<typename Handler> void serialize(Handler & h)
    {
        h & state;
        h & changes;
        h & rewardConfigurations;
    }
};
VCMI_LIB_NAMESPACE_END
