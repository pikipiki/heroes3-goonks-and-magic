/* Native, resumable original-campaign VM entry point. GPL-2.0-or-later. */
#pragma once
#include "EraCampaignExecutor.h"
#include "../json/JsonNode.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_runtime
{
enum class InvocationKind { Initialize, Dispatch, Resume };
struct Invocation
{
 InvocationKind kind=InvocationKind::Initialize;
 std::string receiver;
 std::vector<std::int32_t> selectors;
 bool post=false;
};
struct Result
{
 JsonNode state;
 bool complete=false;
};
// This interpreter is deliberately independent from event registration. The
// game host must provide each native receiver and persist the returned state
// before presenting a query. Compiling a program never enables a campaign.
DLL_LINKAGE Result execute(const JsonNode & program,const JsonNode & savedState,
 const era_campaign::Context & context,era_campaign::Host & host,const Invocation & invocation);
}
VCMI_LIB_NAMESPACE_END
