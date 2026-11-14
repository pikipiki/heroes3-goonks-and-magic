/* Text-bearing reply to a real original-campaign query. */
#pragma once
#include "PacksForServer.h"
VCMI_LIB_NAMESPACE_BEGIN
struct DLL_LINKAGE SourceCampaignReply : public QueryReply
{
 std::string text;
 bool submit=true;
 void visitTyped(ICPackVisitor & visitor) override;
 template<typename Handler> void serialize(Handler & h)
 {h & static_cast<QueryReply &>(*this);h & text;h & submit;}
};
VCMI_LIB_NAMESPACE_END
