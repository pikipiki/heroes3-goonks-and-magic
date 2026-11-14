#include "Global.h"
#include "era/EraCampaignJson.h"
#include "era/EraCampaignRuntime.h"
#include <limits>
using namespace era_campaign;
using namespace era_campaign_json;

struct QueryHost final:Host
{
 int shown=0;
 Step execute(const Command&,const Operation&op,State&,const Context&)override
 {if(op.code!="M")throw std::runtime_error("Unexpected receiver in codec test");++shown;return Step::Suspend;}
 int32_t random(int32_t maximum,bool)override{return maximum;}
};
template<class F>void rejects(F && function)
{bool threw=false;try{function();}catch(const std::runtime_error&){threw=true;}assert(threw);}

int main()
{
 State state;state.programSha256="codec-program";state.initializing=true;state.selectedHero=106;
 state.flags[9]=true;state.v[500]=INT32_MIN;state.z[200]="Question;\n{important}";
 state.w[106][55]=10;state.fast['k']=42;
 state.disabledBlocks[0]=true;state.previousDisabledBlocks[0]=false;
 Operand alias;alias.kind=Kind::Variable;alias.space='v';alias.index=std::make_shared<Operand>();alias.index->kind=Kind::Number;alias.index->number=500;
 state.macros["counter"]=alias;state.frames[0].y[1]=99;
 Frame child;child.x[16]=3;child.y[2]=4;state.frames.push_back(child);
 Continuation call;call.programSha256=state.programSha256;call.command=2;call.operation=1;
 call.commandConditionAccepted=true;call.blocks={0,2};call.blockCursor=1;call.localFrame=true;
 call.loop=true;call.loopEnd=12;call.loopStep=2;call.initialX[1]=7;
 alias.access=Access::Write;call.returnTargets={alias};state.continuations.push_back(call);
 const auto encoded=writeState(state);
 assert(writeState(readState(encoded))==encoded);
 auto broken=encoded;broken["frames"].Vector().clear();rejects([&]{readState(broken);});
 broken=encoded;broken["v"].Vector().push_back(broken["v"].Vector().front());rejects([&]{readState(broken);});
 rejects([]{integer(JsonNode(std::numeric_limits<double>::quiet_NaN()));});
 rejects([]{integer(JsonNode(std::numeric_limits<double>::infinity()));});
 rejects([]{integer(JsonNode(2147483648.0));});
 rejects([]{integer(JsonNode(0.5));});
 rejects([]{readState(JsonNode(42));});
 rejects([]{readProgram(JsonNode("wrong shape"));});
 broken=encoded;broken["continuations"].Vector()[0]=JsonNode(1);rejects([&]{readState(broken);});
 assert(integer(JsonNode(INT32_MIN))==INT32_MIN);

 // Exercise the public production entry point and the real JsonNode codec.
 JsonNode ast;ast["schemaVersion"].Integer()=1;ast["contract"].String()="source-campaign-erm-ast-v1";
 ast["sha256"].String()="dialog-program";ast["source"].String()="codec-conformance";
 ast["initializers"].Vector();ast["blocks"].Vector();
 JsonNode trigger;trigger["receiver"].String()="LE";trigger["kind"].String()="trigger";
 trigger["selectors"].Vector();trigger["conditions"].Vector();trigger["commands"].Vector();
 JsonNode command;command["receiver"].String()="IF";command["selectors"].Vector();command["conditions"].Vector();
 JsonNode operation;operation["code"].String()="M";operation["args"].Vector();
 Operand text;text.kind=Kind::String;text.text="Do not show twice";operation["args"].Vector().push_back(writeOperand(text));
 command["operations"].Vector().push_back(operation);trigger["commands"].Vector().push_back(command);ast["blocks"].Vector().push_back(trigger);
 QueryHost host;Context context;era_campaign_runtime::Invocation invocation;
 auto result=era_campaign_runtime::execute(ast,JsonNode(),context,host,invocation);assert(result.complete&&host.shown==0);
 invocation.kind=era_campaign_runtime::InvocationKind::Dispatch;invocation.receiver="LE";
 result=era_campaign_runtime::execute(ast,result.state,context,host,invocation);assert(!result.complete&&host.shown==1);
 const auto saved=result.state;
 invocation.kind=era_campaign_runtime::InvocationKind::Resume;
 result=era_campaign_runtime::execute(ast,saved,context,host,invocation);assert(result.complete&&host.shown==1);
 assert(readState(result.state).continuations.empty());
 rejects([&]{era_campaign_runtime::execute(ast,result.state,context,host,invocation);});
 broken=saved;broken["programSha256"].String()="different-map";
 rejects([&]{era_campaign_runtime::execute(ast,broken,context,host,invocation);});
 invocation.kind=era_campaign_runtime::InvocationKind::Dispatch;
 rejects([&]{era_campaign_runtime::execute(ast,JsonNode(),context,host,invocation);});
}
