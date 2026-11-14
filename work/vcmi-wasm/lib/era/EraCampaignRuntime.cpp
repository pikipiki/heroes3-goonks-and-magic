/* Native, resumable original-campaign VM entry point. GPL-2.0-or-later. */
#include "StdInc.h"
#include "EraCampaignRuntime.h"
#include "EraCampaignJson.h"

VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_runtime
{
Result execute(const JsonNode & source,const JsonNode & savedState,
 const era_campaign::Context & context,era_campaign::Host & host,const Invocation & invocation)
{
 const auto program=era_campaign_json::readProgram(source);
 auto state=era_campaign_json::readState(savedState);
 era_campaign::Executor executor(program,state,context,host);
 switch(invocation.kind)
 {
 case InvocationKind::Initialize:executor.initialize();break;
 case InvocationKind::Dispatch:
  if(!state.initialized)throw std::runtime_error("Campaign event before initialization");
  executor.dispatch(invocation.receiver,invocation.selectors,invocation.post);break;
 case InvocationKind::Resume:
  if(state.continuations.empty())throw std::runtime_error("Campaign resume without a continuation");
  break;
 }
 const bool complete=executor.run();
 return {era_campaign_json::writeState(state),complete};
}
}
VCMI_LIB_NAMESPACE_END
