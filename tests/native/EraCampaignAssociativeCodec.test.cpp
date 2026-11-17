#include "Global.h"
#include "era/EraCampaignJson.h"
#include "era/EraCampaignRuntime.h"
#include <cassert>
using namespace era_campaign;
using namespace era_campaign_json;
Operand named(char space,std::string name,Access access=Access::Read)
{Operand p;p.kind=Kind::Named;p.space=space;p.name=std::move(name);p.access=access;return p;}
Operand number(int value){Operand p;p.kind=Kind::Number;p.number=value;return p;}
Operand literal(std::string text){Operand p;p.kind=Kind::String;p.text=std::move(text);return p;}
JsonNode command(std::string receiver,std::vector<Operand> selectors,std::string code,std::vector<Operand> args)
{
 JsonNode c;c["receiver"].String()=receiver;c["selectors"].Vector();c["conditions"].Vector();c["operations"].Vector();
 for(const auto & s:selectors)c["selectors"].Vector().push_back(writeOperand(s));
 JsonNode op;op["code"].String()=code;op["args"].Vector();for(const auto & a:args)op["args"].Vector().push_back(writeOperand(a));
 c["operations"].Vector().push_back(op);return c;
}
struct SuspendHost final:Host
{
 int shown=0;
 Step execute(const Command & c,const Operation & op,State &,const Context &)override
 {assert(c.receiver=="IF"&&op.code=="M");++shown;return Step::Suspend;}
 std::int32_t random(std::int32_t maximum,bool)override{return maximum;}
};
template<class F>void rejects(F function){bool failed=false;try{function();}catch(const std::runtime_error&){failed=true;}assert(failed);}
int main()
{
 State source;source.programSha256="named-state";
 source.associative["Cell"]={35,"Master"};source.associative["cell"].integer=58;
 source.associative[""]={1,""};source.macros["Alias"]=named('s',"Cell");
 auto modified=number(7);modified.access=Access::Relative;modified.modifier="|";
 source.macros["Modifier"]=modified;
 const auto saved=writeState(source);auto restored=readState(saved);
 assert(writeState(restored)==saved);
 auto withZero=saved;JsonNode zero;zero["name"].String()="discarded";zero["integer"].Integer()=0;zero["text"].String()="";withZero["associative"].Vector().push_back(zero);assert(!readState(withZero).associative.count("discarded"));
 assert(restored.associative.at("Cell").integer==58&&restored.associative.at("Cell").text=="Master");
 auto old=saved;old.Struct().erase("associative");assert(readState(old).associative.empty());
 assert(restored.associative.size()==2&&restored.associative.count("CELL"));
 auto bad=saved;bad["associative"].Vector().push_back(bad["associative"].Vector().front());rejects([&]{readState(bad);});
 bad=saved;bad["associative"].Vector().push_back(bad["associative"].Vector().back());bad["associative"].Vector().back()["name"].String()="CELL";rejects([&]{readState(bad);});
 bad=saved;bad["associative"].Vector()[0]["integer"]=JsonNode(1.5);rejects([&]{readState(bad);});
 auto badOperand=writeOperand(named('i',"Cell"));badOperand["space"].String()="v";rejects([&]{readOperand(badOperand);});
 Context context;assert(readText(restored.macros.at("Alias"),restored,context)=="Master");
 JsonNode ast;ast["schemaVersion"].Integer()=1;ast["contract"].String()="source-campaign-erm-ast-v1";ast["sha256"].String()="named-resume";ast["source"].String()="associative-codec";
 ast["initializers"].Vector();ast["blocks"].Vector();
 ast["initializers"].Vector().push_back(command("SN",{},"W",{literal("Class"),number(35)}));
 ast["initializers"].Vector().push_back(command("VR",{named('s',"Class")},"S",{literal("Master")}));
 JsonNode trigger;trigger["receiver"].String()="TM";trigger["kind"].String()="trigger";trigger["selectors"].Vector();trigger["conditions"].Vector();trigger["commands"].Vector();
 trigger["commands"].Vector().push_back(command("VR",{named('i',"runs")},"+",{number(1)}));
 trigger["commands"].Vector().push_back(command("IF",{},"M",{literal("%S(Class) %I(Class)")}));
 trigger["commands"].Vector().push_back(command("SN",{},"W",{literal("Class"),named('i',"query",Access::Write)}));
 ast["blocks"].Vector().push_back(trigger);
 SuspendHost host;era_campaign_runtime::Invocation invocation;
 auto result=era_campaign_runtime::execute(ast,JsonNode(),context,host,invocation);assert(result.complete);
 invocation.kind=era_campaign_runtime::InvocationKind::Dispatch;invocation.receiver="TM";
 result=era_campaign_runtime::execute(ast,result.state,context,host,invocation);assert(!result.complete&&host.shown==1);
 assert(readState(result.state).associative.at("runs").integer==1);
 invocation.kind=era_campaign_runtime::InvocationKind::Resume;
 result=era_campaign_runtime::execute(ast,result.state,context,host,invocation);assert(result.complete&&host.shown==1);
 const auto final=readState(result.state);assert(final.associative.at("runs").integer==1&&final.associative.at("query").integer==35&&final.associative.at("Class").text=="Master");
}
