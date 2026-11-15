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
    JsonNode worldState;
    std::map<ObjectInstanceID, Rewardable::Configuration> rewardConfigurations;
    void visitTyped(ICPackVisitor & visitor) override;
    template<typename Handler> void serialize(Handler & h)
    {
        h & state;
        h & changes;
        h & rewardConfigurations;
        if(h.hasFeature(Handler::Version::GOONK_CAMPAIGN_WORLD))
            h & worldState;
        else if(!h.saving)
            worldState=JsonNode();
    }
};
VCMI_LIB_NAMESPACE_END
